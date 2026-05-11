import { BlockData } from "./ClassBlockUtils";

export function cloneBlockData(blockData?: BlockData | null): BlockData | null {
	if (!blockData) {
		return null;
	}

	return {
		...blockData,
		terms: [...blockData.terms]
	};
}

function areTermsEqual(left: number[], right: number[]) {
	if (left.length !== right.length) {
		return false;
	}

	for (let i = 0; i < left.length; i++) {
		if (left[i] !== right[i]) {
			return false;
		}
	}

	return true;
}

export function hasDraftChanges(base?: BlockData | null, draft?: BlockData | null): boolean {
	if (!base || !draft) {
		return false;
	}

	return (
		base.text !== draft.text ||
		base.hourSpan !== draft.hourSpan ||
		base.color !== draft.color ||
		base.note !== draft.note ||
		base.termMode !== draft.termMode ||
		!areTermsEqual(base.terms, draft.terms)
	);
}
