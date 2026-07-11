const Card = ({ className = "", children, ...props }) => (
  <div className={`card ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
