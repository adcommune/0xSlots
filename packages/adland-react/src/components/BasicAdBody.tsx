const BasicAdBody = ({
  name,
  children,
  ...rest
}: {
  children: React.ReactNode;
  name?: string;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className="border p-2 md:p-4 flex hover:cursor-pointer hover:bg-primary/10 flex-row rounded-md justify-between items-center gap-2 relative border-b-2 border-b-primary"
      {...rest}
    >
      {children}
      <div className="flex flex-row items-center border-2 border-primary">
        {name && (
          <div className="text-xs font-semibold text-primary px-1">{name}</div>
        )}
        <div className="inline-flex items-center border p-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
          AD
        </div>
      </div>
    </div>
  );
};

export default BasicAdBody;
