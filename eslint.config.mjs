// eslint.config.mjs
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // 0. 忽略自动生成的 Prisma 代码
  {
    ignores: ['src/generated/**', 'dist/**', 'node_modules/**'],
  },
  // 1. 基础 JS 推荐规则 (应用于所有 .js 和 .ts)
  eslint.configs.recommended,

  // 2. TypeScript 推荐规则 (自动包含 parser 和 plugin)
  ...tseslint.configs.recommended,

  // 3. 自定义规则覆盖
  {
    files: ['**/*.{js,ts}'],
    rules: {
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  // 4. 针对 TS 文件的额外规则
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // 5. 必须放在最后：关闭所有与 Prettier 冲突的规则
  prettierConfig,

  // 6. 忽略文件
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  }
);
