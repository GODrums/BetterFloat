export type LegacyContentScriptConfig = {
	matches: string[];
	run_at?: 'document_start' | 'document_end' | 'document_idle';
	css?: string[];
};
