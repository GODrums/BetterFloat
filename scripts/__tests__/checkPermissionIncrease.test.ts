import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { checkPermissionIncrease } from "../checkPermissionIncrease";

type FixtureExpectation = {
	requiresReacceptance?: boolean;
	addedWarningCategories?: string[];
	addedRequiredPermissions?: string[];
	addedRequiredHostPatterns?: string[];
	ignoredOptionalPermissionChanges?: {
		permissions?: string[];
		hostPermissions?: string[];
	};
	errorIncludes?: string;
};

type FixtureCase = {
	name: string;
	oldManifest?: Record<string, unknown>;
	newManifest?: Record<string, unknown>;
	oldRaw?: string;
	newRaw?: string;
	omitOld?: boolean;
	omitNew?: boolean;
	expected: FixtureExpectation;
};

const FIXTURE_PATH = path.resolve(import.meta.dir, "fixtures/checkPermissionIncreaseCases.json");

let tempRoot = "";

beforeAll(async () => {
	tempRoot = await mkdtemp(path.join(os.tmpdir(), "betterfloat-permission-checker-"));
});

afterAll(async () => {
	if (tempRoot) {
		await rm(tempRoot, { recursive: true, force: true });
	}
});

async function writeFixtureManifest(filePath: string, fixtureCase: FixtureCase, side: "old" | "new"): Promise<void> {
	const shouldOmit = side === "old" ? fixtureCase.omitOld : fixtureCase.omitNew;
	if (shouldOmit) {
		return;
	}

	const raw = side === "old" ? fixtureCase.oldRaw : fixtureCase.newRaw;
	const manifest = side === "old" ? fixtureCase.oldManifest : fixtureCase.newManifest;

	if (raw !== undefined) {
		await writeFile(filePath, raw, "utf8");
		return;
	}

	await writeFile(filePath, JSON.stringify(manifest, null, 2), "utf8");
}

describe("checkPermissionIncrease", async () => {
	const fixtureCases = JSON.parse(await readFile(FIXTURE_PATH, "utf8")) as FixtureCase[];

	for (const fixtureCase of fixtureCases) {
		test(fixtureCase.name, async () => {
			const caseDir = path.join(tempRoot, fixtureCase.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase());
			const oldDir = path.join(caseDir, "old");
			const newDir = path.join(caseDir, "new");
			const oldPath = path.join(oldDir, "manifest.json");
			const newPath = path.join(newDir, "manifest.json");

			await mkdir(oldDir, { recursive: true });
			await mkdir(newDir, { recursive: true });
			await Bun.write(path.join(oldDir, ".keep"), "");
			await Bun.write(path.join(newDir, ".keep"), "");
			await writeFixtureManifest(oldPath, fixtureCase, "old");
			await writeFixtureManifest(newPath, fixtureCase, "new");

			if (fixtureCase.expected.errorIncludes) {
				await expect(checkPermissionIncrease(oldPath, newPath)).rejects.toThrow(fixtureCase.expected.errorIncludes);
				return;
			}

			const result = await checkPermissionIncrease(oldPath, newPath);

			expect(result.requiresReacceptance).toBe(fixtureCase.expected.requiresReacceptance ?? false);
			expect(result.addedWarningCategories).toEqual(fixtureCase.expected.addedWarningCategories ?? []);
			expect(result.addedRequiredPermissions).toEqual(fixtureCase.expected.addedRequiredPermissions ?? []);
			expect(result.addedRequiredHostPatterns).toEqual(fixtureCase.expected.addedRequiredHostPatterns ?? []);
			expect(result.ignoredOptionalPermissionChanges.permissions).toEqual(
				fixtureCase.expected.ignoredOptionalPermissionChanges?.permissions ?? []
			);
			expect(result.ignoredOptionalPermissionChanges.hostPermissions).toEqual(
				fixtureCase.expected.ignoredOptionalPermissionChanges?.hostPermissions ?? []
			);
		});
	}

		test("cli exits with code 2 and emits json when reacceptance is required", async () => {
			const caseDir = path.join(tempRoot, "cli-smoke");
			const oldPath = path.join(caseDir, "old", "manifest.json");
			const newPath = path.join(caseDir, "new", "manifest.json");

			await mkdir(path.dirname(oldPath), { recursive: true });
			await mkdir(path.dirname(newPath), { recursive: true });
			await Bun.write(oldPath, JSON.stringify({ manifest_version: 3, name: "Old", version: "1.0.0" }, null, 2));
		await Bun.write(
			newPath,
			JSON.stringify({ manifest_version: 3, name: "New", version: "1.0.1", permissions: ["notifications"] }, null, 2)
		);

		const subprocess = Bun.spawn({
			cmd: ["bun", "run", "scripts/checkPermissionIncrease.ts", oldPath, newPath, "--json"],
			cwd: path.resolve(import.meta.dir, "..", ".."),
			stdout: "pipe",
			stderr: "pipe"
		});

		const [stdout, stderr, exitCode] = await Promise.all([
			new Response(subprocess.stdout).text(),
			new Response(subprocess.stderr).text(),
			subprocess.exited
		]);

		expect(exitCode).toBe(2);
		expect(stderr).toBe("");

		const output = JSON.parse(stdout);
		expect(output.requiresReacceptance).toBe(true);
		expect(output.addedRequiredPermissions).toEqual(["notifications"]);
	});
});
