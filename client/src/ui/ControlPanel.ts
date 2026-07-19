import type { ControlDefinition, LabConfig } from '../scene/types';

type EditableConfig = LabConfig & Record<string, unknown>;

function controlValue(config: EditableConfig, key: string, definition: ControlDefinition) {
  return config[key] ?? definition.default ?? (definition.type === 'toggle' ? false : '');
}

function setNumberBounds(input: HTMLInputElement, definition: Extract<ControlDefinition, { type: 'range' | 'number' }>) {
  if (typeof definition.min === 'number') input.min = String(definition.min);
  if (typeof definition.max === 'number') input.max = String(definition.max);
  if (typeof definition.step === 'number') input.step = String(definition.step);
}

export function renderControlPanel<TConfig extends LabConfig>(
  container: HTMLElement,
  config: TConfig,
  onChange: (nextConfig: TConfig) => void
) {
  const controls = config.adjustableVariables ?? {};
  container.innerHTML = '';

  if (Object.keys(controls).length === 0) {
    container.hidden = true;
    return;
  }

  container.hidden = false;
  container.className = 'control-panel';

  const title = document.createElement('h2');
  title.textContent = 'Controls';
  container.appendChild(title);

  let currentConfig = { ...(config as EditableConfig) };

  Object.entries(controls).forEach(([key, definition]) => {
    const field = document.createElement('label');
    field.className = 'control-field';

    const name = document.createElement('span');
    name.textContent = definition.label ?? key;
    field.appendChild(name);

    const valueText = document.createElement('small');
    valueText.className = 'control-value';

    const applyValue = (value: unknown) => {
      currentConfig = { ...currentConfig, [key]: value };
      valueText.textContent = `${String(value)}${'unit' in definition && definition.unit ? ` ${definition.unit}` : ''}`;
      onChange(currentConfig as unknown as TConfig);
    };

    if (definition.type === 'select') {
      const select = document.createElement('select');
      definition.options.forEach((option) => {
        const optionEl = document.createElement('option');
        optionEl.value = option;
        optionEl.textContent = option;
        select.appendChild(optionEl);
      });
      select.value = String(controlValue(currentConfig, key, definition));
      valueText.textContent = select.value;
      select.addEventListener('change', () => applyValue(select.value));
      field.appendChild(select);
    } else if (definition.type === 'toggle') {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = Boolean(controlValue(currentConfig, key, definition));
      valueText.textContent = input.checked ? 'on' : 'off';
      input.addEventListener('change', () => applyValue(input.checked));
      field.appendChild(input);
    } else {
      const input = document.createElement('input');
      input.type = definition.type === 'range' ? 'range' : 'number';
      setNumberBounds(input, definition);
      input.value = String(controlValue(currentConfig, key, definition));
      valueText.textContent = `${input.value}${definition.unit ? ` ${definition.unit}` : ''}`;
      input.addEventListener('input', () => {
        const numericValue = Number(input.value);
        applyValue(Number.isFinite(numericValue) ? numericValue : input.value);
      });
      field.appendChild(input);
    }

    field.appendChild(valueText);
    container.appendChild(field);
  });
}
