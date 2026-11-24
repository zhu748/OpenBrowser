function readOption(option, property, fallback = option) {
  if (option == null || !property) return fallback;
  return typeof property === 'function' ? property(option) : option[property];
}

export function indexOfSelectedOption(options, selected) {
  return selected === null ? -1 : options.findIndex(option => option === selected);
}

export function createSelectOptionModel(settings) {
  function labelOf(option) {
    if (option == null) return '';
    return String(typeof option === 'object'
      ? readOption(option, settings.optionLabel, option.label ?? option)
      : option);
  }
  function valueOf(option) {
    return option == null ? option : readOption(option, settings.optionValue);
  }
  function optionDisabled(option) {
    return Boolean(readOption(option, settings.optionDisabled, false));
  }
  function valuesEqual(left, right) {
    if (left === right) return true;
    if (!left || !right || typeof left !== 'object' || typeof right !== 'object' || !settings.optionValue) return false;
    return valueOf(left) === valueOf(right);
  }
  function findSelectedOption(options, value) {
    if (value == null || value === '') return null;
    return options.find(option => settings.optionValue ? valueOf(option) === value : valuesEqual(option, value)) ?? null;
  }
  function findTypedOption(options, text) {
    const match = options.find(option => labelOf(option) === text
      || (settings.optionValue && String(valueOf(option)) === text));
    // Zero and false are choices, while empty entries still fall back to the typed text.
    return match || match === 0 || match === false ? match : undefined;
  }
  function filterOptions(options, query) {
    if (!query) return options;
    if (!options.length) return [];
    const locale = settings.filterLocale;
    const needle = query.toLocaleLowerCase(locale);
    const fields = settings.filterFields?.length
      ? settings.filterFields
      : [typeof settings.optionLabel === 'string' ? settings.optionLabel : 'label'];
    const mode = settings.filterMatchMode;
    return options.filter(option => fields.some(field => {
      const value = option && typeof option === 'object' ? option[field] ?? labelOf(option) : option ?? '';
      const text = String(value).toLocaleLowerCase(locale);
      if (mode === 'startsWith') return text.startsWith(needle);
      if (mode === 'endsWith') return text.endsWith(needle);
      return text.includes(needle);
    }));
  }
  return { labelOf, valueOf, optionDisabled, valuesEqual, findSelectedOption, findTypedOption, filterOptions };
}
