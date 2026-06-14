import pluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,cjs,ts,vue,jsx,tsx}'],
  },

  {
    ignores: [
      '**/dist/**', 
      '**/dist-ssr/**', 
      '**/coverage/**', 
      '**/node_modules/**',
      '**/.venv/**',
      'public/**',
      '*.config.js',
      '*.config.ts',
      'eslint.config.js',
      'test_subtask.ts'
    ],
  },

  ...pluginVue.configs['flat/essential'],
  ...vueTsEslintConfig(),
  
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    }
  }
]
