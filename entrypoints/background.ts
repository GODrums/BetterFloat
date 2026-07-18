import.meta.glob('../src/background/messages/*.ts', { eager: true });

export default defineBackground(async () => {
	await import('../src/background/index');
});
