export const NONE_EXCLUSIVE_OPTION = 'None';

/** "None" cannot coexist with other selections — prefer the specific values. */
export function sanitizeNoneExclusiveSelection(selected: string[]): string[] {
  if (!selected.includes(NONE_EXCLUSIVE_OPTION) || selected.length <= 1) {
    return selected;
  }
  return selected.filter((item) => item !== NONE_EXCLUSIVE_OPTION);
}

export function applyNoneExclusiveToggle(
  selected: string[],
  opt: string,
  hasNoneOption: boolean,
): string[] {
  if (!hasNoneOption) {
    return selected.includes(opt)
      ? selected.filter((item) => item !== opt)
      : [...selected, opt];
  }

  if (selected.includes(opt)) {
    return selected.filter((item) => item !== opt);
  }

  if (opt === NONE_EXCLUSIVE_OPTION) {
    return [NONE_EXCLUSIVE_OPTION];
  }

  return [...selected.filter((item) => item !== NONE_EXCLUSIVE_OPTION), opt];
}
