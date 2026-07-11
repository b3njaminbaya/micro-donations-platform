import { Link } from "react-router-dom";

const VARIANTS = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  gold: "btn-gold",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

const Button = ({ variant = "primary", to, href, className = "", children, ...props }) => {
  const classes = `${VARIANTS[variant] || VARIANTS.primary} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export default Button;
