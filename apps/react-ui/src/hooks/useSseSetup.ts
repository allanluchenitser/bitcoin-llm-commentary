
import { useEffect } from 'react';

type SseSetupParams = {
  path: string,
  channels: string | string[],
  onUpdates: ((event: MessageEvent) => void) | ((event: MessageEvent) => void)[],
  onStatus?: (status: 'connecting' | 'open' | 'closed' | 'error') => void,
};

export function useSseSetup({
  path,
  channels,
  onStatus,
  onUpdates,
}: SseSetupParams) {
	useEffect(() => {
		const arrayMode = Array.isArray(channels) && Array.isArray(onUpdates);
		const singleMode = typeof channels === 'string' && typeof onUpdates === 'function';

		if (!arrayMode && !singleMode) {
			console.error("Invalid parameters for useSseSetup: channels and onUpdates should both be either arrays of the same length or a single string/function.");
			throw new Error("Invalid parameters for useSseSetup");
		}

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

		if (arrayMode) {
			channels.forEach((channel, index) => es.addEventListener(channel, onUpdates[index]));
		}
		else if (singleMode) {
			es.addEventListener(channels, onUpdates);
		}

		return () => {
			es.removeEventListener('open', onOpen);
			es.removeEventListener('error', onError);

			if (arrayMode) {
				channels.forEach((channel, index) => es.removeEventListener(channel, onUpdates[index]));
			}
			else if (singleMode) {
				es.removeEventListener(channels, onUpdates);
			}
			es.close();
			onStatus?.('closed');
		};
	}, []);
}
