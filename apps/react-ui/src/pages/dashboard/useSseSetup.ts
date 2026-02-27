
import { useEffect } from 'react';

type SseSetupParams = {
  path: string,
  channel: string,
  onStatus: (status: 'connecting' | 'open' | 'closed' | 'error') => void,
  onUpdate: (event: MessageEvent) => void,
};

export function useSseSetup({
  path,
  channel,
	onStatus,
  onUpdate,
}: SseSetupParams) {
	useEffect(() => {
		const es = new EventSource(path);
		onStatus?.('connecting');

		const onOpen = () => {
			onStatus?.('open');
		};
		const onError = () => {
			onStatus?.('error');
		};

		es.addEventListener('open', onOpen);
		es.addEventListener('error', onError);
		es.addEventListener(channel, onUpdate);

		return () => {
			es.removeEventListener('open', onOpen);
			es.removeEventListener('error', onError);
			es.removeEventListener(channel, onUpdate);
			es.close();
			onStatus?.('closed');
		};
	}, []);
}
