import React from 'react';

/**
 * Universal Button Primitive
 * @param {'primary' | 'cta' | 'secondary'} variant - Button styling variant
 */
export const Button = ({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
  className = '',
  style = {},
  type = 'button',
  ...props
}) => {
  const variantClass = `kiosk-btn-${variant}`;

  return (
    <button
      type={type}
      className={`kiosk-btn ${variantClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
};

export const PrimaryButton = (props) => <Button variant="primary" {...props} />;
export const CtaButton = (props) => <Button variant="cta" {...props} />;
export const SecondaryButton = (props) => <Button variant="secondary" {...props} />;

export default Button;
