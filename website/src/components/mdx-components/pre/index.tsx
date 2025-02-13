import cn from 'clsx'
import type { ComponentProps, FC, ReactNode } from 'react'
import { WordWrapIcon } from 'nextra/icons'
import { CopyToClipboard } from './copy-to-clipboard'
import { ToggleWordWrapButton } from './toggle-word-wrap-button'

export const classes = {
  border: cn(
    'border border-gray-300 dark:border-neutral-700',
    'contrast-more:border-gray-900 contrast-more:dark:border-gray-50'
  )
}

export type PreProps = ComponentProps<'pre'> & {
  'data-filename'?: string
  'data-copy'?: ''
  'data-language'?: string
  'data-word-wrap'?: ''
  'data-pagefind-ignore'?: string
  icon?: ReactNode
}

export const Pre: FC<PreProps> = ({
  children,
  className,
  'data-filename': filename,
  'data-copy': copy,
  'data-language': _language,
  'data-word-wrap': hasWordWrap,
  'data-pagefind-ignore': pagefindIgnore,
  icon,
  ...props
}) => {
  const copyButton = copy === '' && (
    <CopyToClipboard className={filename ? 'ms-auto text-sm' : ''} />
  )

  return (
    <div
      data-pagefind-ignore={pagefindIgnore}
      className="nextra-code relative not-first:mt-6"
    >
      {filename && (
        <div
          className={cn(
            'px-4 text-xs text-gray-700 dark:text-gray-200',
            'bg-gray-100 dark:bg-neutral-900',
            'flex items-center h-12 gap-2 rounded-t-md',
            classes.border,
            'border-b-0'
          )}
        >
          {icon}
          <span className="truncate">{filename}</span>
          {copyButton}
        </div>
      )}
      <pre
        className={cn(
          'group',
          'focus-visible:nextra-focus',
          'overflow-x-auto subpixel-antialiased text-[.9em]',
          'bg-white dark:bg-black py-4',
          'ring-1 ring-inset ring-gray-300 dark:ring-neutral-700',
          'contrast-more:ring-gray-900 contrast-more:dark:ring-gray-50',
          'contrast-more:contrast-150',
          filename ? 'rounded-b-md' : 'rounded-md',
          'not-prose', // for nextra-theme-blog
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'group-hover:opacity-100',
            'group-focus:opacity-100',
            'opacity-0 transition focus-within:opacity-100',
            'flex gap-1 absolute right-4',
            filename ? 'top-14' : 'top-2'
          )}
        >
          {hasWordWrap === '' && (
            <ToggleWordWrapButton>
              <WordWrapIcon height="1em" />
            </ToggleWordWrapButton>
          )}
          {!filename && copyButton}
        </div>
        {children}
      </pre>
    </div>
  )
}