import Link from 'next/link'
import dynamic from 'next/dynamic'

import TextButton from './basic/text-button'
import { isTestnet, documentTitle } from '../utils/constants'

const ConnectButton = dynamic(() => import('./connect-button'), { ssr: false })

export default function Toolbar(props: { className?: string }) {
  return (
    <header className={props.className}>
      <Link
        href="/"
        className="hidden h-18 w-18 shrink-0 cursor-pointer items-center justify-center border-r border-gray-200 sm:flex"
      >
        <svg
          width="320"
          height="320"
          viewBox="0 0 320 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 text-primary-600"
        >
          <path
            d="M318.837 30.7001C318.723 31.8371 318.268 32.9741 317.586 34.2248L267.103 137.691L194.336 286.751C192.744 289.821 190.47 292.663 187.628 294.937C184.671 297.325 180.806 298.576 176.144 298.576H115.883C111.335 298.576 107.924 297.325 105.878 294.937C103.604 292.663 102.239 289.821 101.785 286.751L80.864 147.469C80.0681 141.784 75.1791 137.577 69.3804 137.577H26.8569C21.1719 137.577 16.2828 133.371 15.3732 127.686L1.38824 34.1111C1.16084 32.8604 0.933444 31.7234 1.16084 30.5864C1.61564 28.6535 2.75263 26.6069 4.68552 24.9014C6.61841 23.1959 8.8924 22.4 11.2801 22.4H60.0571C64.2639 22.4 67.4475 23.537 69.3804 25.9247C71.1996 28.3124 72.3366 30.4727 72.4503 32.5193L85.412 127.572C86.2079 133.257 91.097 137.577 96.8956 137.577H139.078C144.877 137.577 149.766 141.898 150.562 147.583L159.658 214.893L196.496 137.577L246.638 32.5193C247.775 30.359 249.594 28.3124 252.323 25.9247C254.824 23.537 258.349 22.4 262.555 22.4H311.56C313.948 22.4 315.767 23.1959 317.245 24.9014C318.609 26.7206 319.178 28.6535 318.837 30.7001Z"
            fill="currentColor"
          />
        </svg>
      </Link>
      <div className="flex-1">
        <div className="mx-auto flex h-18 max-w-5xl items-center justify-between px-6">
          <TextButton primary href="/">
            <h1 className="text-lg font-bold">
              {documentTitle}
              {isTestnet ? ' TESTNET' : null}
            </h1>
          </TextButton>
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}
