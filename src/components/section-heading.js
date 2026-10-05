export default function SectionHeading({ as: Tag = "h2", children }) {
  return <Tag className="mb-8 text-center text-2xl font-semibold text-black md:mb-10 md:text-[2rem]">{children}</Tag>;
}
