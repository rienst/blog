import Link from 'next/link'

type LinkProps = Parameters<typeof Link>[0]

export type LowProfileLinkProps = Omit<LinkProps, 'className'>

export function LowProfileLink(props: LowProfileLinkProps) {
  return <Link className="hover:underline underline-offset-2" {...props} />
}
