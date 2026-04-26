import type { Rule } from 'eslint';

/**
 * ESLint Rule: no-literal-tokens
 * 
 * Bans hardcoded hex colors, px values, and rem values in archetype source.
 * Enforces usage of semantic tokens from the Skeed design system.
 * 
 * @example
 * // Invalid:
 * <div className="bg-[#FF0000] p-[16px]">
 * 
 * // Valid:
 * <div className="bg-[--skeed-color-danger-500] p-[--skeed-density-cozy-pady]">
 */

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow literal hex colors, px/rem values in favor of semantic tokens',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          allowInComments: { type: 'boolean' },
          severity: { type: 'string', enum: ['error', 'warn'] },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noHexColors: 'Use semantic color tokens (e.g., --skeed-color-brand-500) instead of hex colors.',
      noPxValues: 'Use density tokens (e.g., --skeed-density-cozy-pady) instead of px values.',
      noRemValues: 'Use spacing tokens (e.g., --skeed-spacing-4) instead of rem values.',
      noRgbValues: 'Use semantic color tokens instead of rgb/rgba values.',
      noHslValues: 'Use semantic color tokens instead of hsl values.',
    },
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    const options = context.options[0] || {};
    const allowInComments = options.allowInComments ?? false;

    // Patterns to detect literal values
    const patterns = [
      {
        regex: /#[0-9a-fA-F]{3,8}/g,
        messageId: 'noHexColors' as const,
        getReplacement: (match: string) => `/* TODO: Replace ${match} with semantic token */`,
      },
      {
        regex: /\d+px/g,
        messageId: 'noPxValues' as const,
        getReplacement: () => '[--skeed-density-cozy-pady]',
      },
      {
        regex: /\d+\.?\d*rem/g,
        messageId: 'noRemValues' as const,
        getReplacement: () => '[--skeed-spacing-4]',
      },
      {
        regex: /rgb\([^)]+\)|rgba\([^)]+\)/gi,
        messageId: 'noRgbValues' as const,
        getReplacement: (match: string) => `/* TODO: Replace ${match} with semantic token */`,
      },
      {
        regex: /hsl\([^)]+\)|hsla\([^)]+\)/gi,
        messageId: 'noHslValues' as const,
        getReplacement: (match: string) => `/* TODO: Replace ${match} with semantic token */`,
      },
    ];

    function checkNode(node: any) {
      if (!node.value || typeof node.value !== 'string') return;

      const value = node.value;

      for (const { regex, messageId, getReplacement } of patterns) {
        let match: RegExpExecArray | null;
        regex.lastIndex = 0;
        
        while ((match = regex.exec(value)) !== null) {
          // Skip if inside a CSS variable reference
          const contextStr = value.substring(
            Math.max(0, match.index! - 20),
            Math.min(value.length, match.index! + match[0].length + 20)
          );
          
          if (contextStr.includes('--skeed-') || contextStr.includes('var(')) {
            continue;
          }

          context.report({
            node,
            messageId,
            loc: {
              start: {
                line: node.loc?.start?.line ?? 1,
                column: (node.loc?.start?.column ?? 0) + match.index!,
              },
              end: {
                line: node.loc?.start?.line ?? 1,
                column: (node.loc?.start?.column ?? 0) + match.index! + match[0].length,
              },
            },
            fix(fixer: any) {
              const replacement = getReplacement(match[0]!);
              return fixer.replaceText(
                node,
                node.raw.replace(match[0]!, replacement)
              );
            },
          });
        }
      }
    }

    return {
      // Check JSX attribute values
      JSXAttribute(node: any) {
        if (node.value?.type === 'Literal') {
          checkNode(node.value);
        }
        // Handle JSX expressions: className={"bg-red-500"}
        if (node.value?.type === 'JSXExpressionContainer' && node.value.expression?.type === 'Literal') {
          checkNode(node.value.expression);
        }
      },
      
      // Check template literals
      TemplateLiteral(node: any) {
        for (const quasi of node.quasis) {
          checkNode(quasi);
        }
      },
      
      // Check string literals
      Literal(node: any) {
        // Skip comments if configured
        if (allowInComments && node.parent?.type?.includes('Comment')) {
          return;
        }
        checkNode(node);
      },
      
      // Check comments
      ...(allowInComments ? {} : {
        LineComment(node: any) {
          checkNode(node);
        },
        BlockComment(node: any) {
          checkNode(node);
        },
      }),
    };
  },
};

export default rule;
