'use client'

import * as React from 'react'
import { OTPInput, OTPInputContext } from 'input-otp'

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

function InputOTP({ className, containerClassName, ...props }) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        'flex items-center gap-2 has-disabled:opacity-50',
        containerClassName
      )}
      className={cn('disabled:cursor-not-allowed', className)}
      {...props}
    />
  )
}

function InputOTPGroup({ className, ...props }) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn('flex items-center', className)}
      {...props}
    />
  )
}

function InputOTPSlot({ index, className, ...props }) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        'relative flex h-11 w-9 items-center justify-center border-y border-r border-gray-300 text-sm font-mono transition-all outline-none first:rounded-l-lg first:border-l last:rounded-r-lg',
        isActive && 'z-10 border-gray-500 ring-2 ring-gray-300',
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse bg-gray-800 h-5 w-px" />
        </div>
      )}
    </div>
  )
}

function InputOTPSeparator({ ...props }) {
  return (
    <div data-slot="input-otp-separator" role="separator" className="text-gray-400 text-lg font-mono mx-0.5" {...props}>
      /
    </div>
  )
}

/**
 * NRC Number Input
 * Zambian National Registration Card format: XXXXXX/XX/X
 * (6 digits, slash, 2 digits, slash, 1 digit)
 */
function NRCInput({ value, onChange }) {
  return (
    <InputOTP
      maxLength={9}
      pattern="^\d*$"
      value={value}
      onChange={onChange}
    >
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={6} />
        <InputOTPSlot index={7} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={8} />
      </InputOTPGroup>
    </InputOTP>
  )
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator, NRCInput }
