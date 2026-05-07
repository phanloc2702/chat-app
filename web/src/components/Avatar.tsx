type AvatarProps = {
  name?: string | null;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

const getInitial = (name?: string | null) => {
  if (!name) return '?';
  return name.trim().charAt(0).toUpperCase();
};

const Avatar = ({ name, imageUrl, size = 'md' }: AvatarProps) => {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name || 'avatar'}
        className={`${sizeClasses[size]} rounded-full object-cover shadow-sm`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-violet-500 font-bold text-white shadow-sm`}
    >
      {getInitial(name)}
    </div>
  );
};

export default Avatar;