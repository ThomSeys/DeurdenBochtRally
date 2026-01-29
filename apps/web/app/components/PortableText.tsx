import { PortableText as PortableTextReact } from '@portabletext/react';

interface PortableTextProps {
  value: any;
}

const components = {
  block: {
    h1: ({ children }: any) => (
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-primary-700 to-primary-600 mb-8 mt-16 first:mt-0 uppercase tracking-tight leading-tight">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-8 mt-16 first:mt-0 tracking-tight border-l-4 border-accent-500 pl-6 leading-tight">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 mt-10 tracking-tight">
        {children}
      </h3>
    ),
    normal: ({ children }: any) => (
      <p className="text-lg md:text-xl text-gray-700 leading-[1.8] mb-6">
        {children}
      </p>
    ),
  },
  marks: {
    strong: ({ children }: any) => (
      <strong className="font-black text-primary-700 px-1 py-0.5 rounded">{children}</strong>
    ),
    em: ({ children }: any) => (
      <em className="not-italic font-semibold text-primary-600 border-b-2 border-primary-300">{children}</em>
    ),
    link: ({ children, value }: any) => (
      <a
        href={value.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-600 hover:text-primary-800 underline decoration-2 underline-offset-4 font-semibold transition-colors"
      >
        {children}
      </a>
    ),
  },
  list: {
    bullet: ({ children }: any) => (
      <ul className="space-y-5 mb-10 mt-8 bg-gradient-to-br from-gray-50 to-accent-50 p-6 border-l-4 border-accent-500">{children}</ul>
    ),
    number: ({ children }: any) => (
      <ol className="space-y-5 mb-10 mt-8 bg-gradient-to-br from-gray-50 to-accent-50 p-6 border-l-4 border-accent-500 list-decimal list-inside">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }: any) => (
      <li className="flex items-start group">
        <span className="text-accent-500 font-black text-2xl mr-4 group-hover:scale-110 transition-transform">✓</span>
        <span className="text-lg md:text-xl text-gray-800 font-medium">{children}</span>
      </li>
    ),
    number: ({ children }: any) => (
      <li className="text-lg md:text-xl text-gray-800 font-medium">{children}</li>
    ),
  },
};

export default function PortableText({ value }: PortableTextProps) {
  return <PortableTextReact value={value} components={components} />;
}
