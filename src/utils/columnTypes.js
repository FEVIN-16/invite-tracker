export function generateFieldKey(label) {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function generateUniqueFieldKey(label, existingKeys) {
  const base = generateFieldKey(label);
  if (!existingKeys.includes(base)) return base;
  let i = 2;
  while (existingKeys.includes(`${base}_${i}`)) i++;
  return `${base}_${i}`;
}

export const COLUMN_TYPE_LABELS = {
  text: 'Short Text',
  textarea: 'Long Text',
  number: 'Number',
  phone: 'Phone',
  date: 'Date',
  checkbox: 'Checkbox',
  select: 'Dropdown (Single)',
  multiselect: 'Multi Select',
  radio: 'Radio / Pills',
};

export const OPTIONS_TYPES = ['select', 'multiselect', 'radio'];
