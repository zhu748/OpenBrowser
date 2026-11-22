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
  function matchesQuery(option, fields, needle) {
    const labels = fields.map(field => String(typeof option !== 'object' || !option
      ? (option ?? '')
      : (option[field] ?? labelOf(option))));
    return labels.some(label => {
      const text = label.toLocaleLowerCase(settings.filterLocale);
      switch (settings.filterMatchMode) {
        case 'startsWith': return text.startsWith(needle);
        case 'endsWith': return text.endsWith(needle);
        default: return text.includes(needle);
      }
    });
  }
  function filterOptions(options, query) {
    if (!query) return options;
    let fields, needle;
    return options.filter(option => {
      if (!fields) {
        // Resolve search settings only when an option is actually visited.
        needle = query.toLocaleLowerCase(settings.filterLocale);
        fields = settings.filterFields?.length
          ? settings.filterFields
          : [typeof settings.optionLabel === 'string' ? settings.optionLabel : 'label'];
      }
      return matchesQuery(option, fields, needle);
    });
  }
  return { labelOf, valueOf, optionDisabled, valuesEqual, findSelectedOption, filterOptions };
}
