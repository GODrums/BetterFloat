import inject from 'url:~lib/util/old_inject.ts';

// inject script into page
export function injectScript() {
	const script = document.createElement('script');
	script.type = 'module';
	script.src = inject;
	script.onload = function () {
		(<typeof script>this).remove();
	};
	(document.head || document.documentElement).appendChild(script);
}
