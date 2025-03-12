import Link from 'next/link'

type LinkProps = Parameters<typeof Link>[0]

export type StyledLinkProps = Omit<LinkProps, 'className'>

export function StyledLink(props: StyledLinkProps) {
  return (
    <Link
      className="text-primary-600 underline underline-offset-2 dark:text-primary-400"
      {...props}
    />
  )
}
