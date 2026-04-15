import type { EditorSettings as EditorSettingsType } from '@/types/settings';
import {
  SettingsSection,
  SliderSetting,
  ToggleSetting,
  SelectSetting,
  SettingItem,
} from './SettingsComponents';
import { useSettingsStore } from '@/stores';

const FONT_FAMILIES = [
  { value: 'JetBrains Mono', label: 'JetBrains Mono' },
  { value: 'Fira Code', label: 'Fira Code' },
  { value: 'Source Code Pro', label: 'Source Code Pro' },
  { value: 'Cascadia Code', label: 'Cascadia Code' },
  { value: 'Monaco', label: 'Monaco' },
  { value: 'Consolas', label: 'Consolas' },
];

const TAB_SIZES = [
  { value: '2', label: '2 spaces' },
  { value: '4', label: '4 spaces' },
];

const WORD_WRAP_OPTIONS = [
  { value: 'on', label: 'On' },
  { value: 'off', label: 'Off' },
  { value: 'wordWrapColumn', label: 'Word Wrap Column' },
  { value: 'bounded', label: 'Bounded' },
];

const LINE_NUMBERS_OPTIONS = [
  { value: 'on', label: 'On' },
  { value: 'off', label: 'Off' },
  { value: 'relative', label: 'Relative' },
  { value: 'interval', label: 'Interval' },
];

export function EditorSettings() {
  const editor = useSettingsStore((state) => state.editor);
  const updateEditorSettings = useSettingsStore((state) => state.updateEditorSettings);

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Font"
        description="Configure the editor font settings"
      >
        <SettingItem>
          <SliderSetting
            label="Font Size"
            value={editor.fontSize}
            min={10}
            max={24}
            unit="px"
            onChange={(fontSize) => updateEditorSettings({ fontSize })}
          />
        </SettingItem>
        <SettingItem>
          <SelectSetting
            label="Font Family"
            value={editor.fontFamily}
            options={FONT_FAMILIES}
            onChange={(fontFamily) => updateEditorSettings({ fontFamily })}
          />
        </SettingItem>
        <SettingItem>
          <SelectSetting
            label="Tab Size"
            value={String(editor.tabSize)}
            options={TAB_SIZES}
            onChange={(tabSize) => updateEditorSettings({ tabSize: Number(tabSize) })}
          />
        </SettingItem>
      </SettingsSection>

      <SettingsSection
        title="Wrapping"
        description="Configure text wrapping behavior"
      >
        <SettingItem>
          <SelectSetting
            label="Word Wrap"
            value={editor.wordWrap}
            options={WORD_WRAP_OPTIONS}
            onChange={(wordWrap) =>
              updateEditorSettings({ wordWrap: wordWrap as EditorSettingsType['wordWrap'] })
            }
          />
        </SettingItem>
        {(editor.wordWrap === 'wordWrapColumn' || editor.wordWrap === 'bounded') && (
          <SettingItem>
            <SliderSetting
              label="Word Wrap Column"
              value={editor.wordWrapColumn}
              min={40}
              max={200}
              onChange={(wordWrapColumn) => updateEditorSettings({ wordWrapColumn })}
            />
          </SettingItem>
        )}
      </SettingsSection>

      <SettingsSection
        title="Display"
        description="Configure editor display options"
      >
        <SettingItem>
          <SelectSetting
            label="Line Numbers"
            value={editor.lineNumbers}
            options={LINE_NUMBERS_OPTIONS}
            onChange={(lineNumbers) =>
              updateEditorSettings({ lineNumbers: lineNumbers as EditorSettingsType['lineNumbers'] })
            }
          />
        </SettingItem>
        <SettingItem>
          <ToggleSetting
            label="Minimap"
            description="Show code minimap on the right side"
            checked={editor.minimap}
            onChange={(minimap) => updateEditorSettings({ minimap })}
          />
        </SettingItem>
        <SettingItem>
          <ToggleSetting
            label="Line Highlight"
            description="Highlight the current line"
            checked={editor.lineHighlight}
            onChange={(lineHighlight) => updateEditorSettings({ lineHighlight })}
          />
        </SettingItem>
        <SettingItem>
          <ToggleSetting
            label="Bracket Pair Colorization"
            description="Color matching bracket pairs"
            checked={editor.bracketPairColorization}
            onChange={(bracketPairColorization) =>
              updateEditorSettings({ bracketPairColorization })
            }
          />
        </SettingItem>
      </SettingsSection>

      <SettingsSection
        title="Auto-Save"
        description="Configure automatic saving"
      >
        <SettingItem>
          <ToggleSetting
            label="Auto-Save"
            description="Automatically save files after a delay"
            checked={editor.autoSave}
            onChange={(autoSave) => updateEditorSettings({ autoSave })}
          />
        </SettingItem>
        {editor.autoSave && (
          <SettingItem>
            <SliderSetting
              label="Auto-Save Delay"
              value={editor.autoSaveDelay}
              min={500}
              max={10000}
              step={500}
              unit="ms"
              onChange={(autoSaveDelay) => updateEditorSettings({ autoSaveDelay })}
            />
          </SettingItem>
        )}
      </SettingsSection>

      <SettingsSection
        title="Auto-Compile"
        description="Configure automatic compilation"
      >
        <SettingItem>
          <ToggleSetting
            label="Auto-Compile"
            description="Automatically compile LaTeX after saving"
            checked={editor.autoCompile}
            onChange={(autoCompile) => updateEditorSettings({ autoCompile })}
          />
        </SettingItem>
        {editor.autoCompile && (
          <SettingItem>
            <SliderSetting
              label="Auto-Compile Delay"
              value={editor.autoCompileDelay}
              min={500}
              max={10000}
              step={500}
              unit="ms"
              onChange={(autoCompileDelay) => updateEditorSettings({ autoCompileDelay })}
            />
          </SettingItem>
        )}
      </SettingsSection>
    </div>
  );
}
