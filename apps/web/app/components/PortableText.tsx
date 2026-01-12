import { PortableText as PortableTextReact } from '@portabletext/react';

interface PortableTextProps {
  value: any;
}

const components = {
  block: {
    h1: ({ children }: any) => (
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 uppercase">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
        {children}
      </h3>
    ),
    normal: ({ children }: any) => (
      <p className="text-lg text-gray-700 leading-relaxed mb-4">
        {children}
      </p>
    ),
  },
  marks: {
    strong: ({ children }: any) => (
      <strong className="font-bold text-gray-900">{children}</strong>
    ),
    em: ({ children }: any) => (
      <em className="italic">{children}</em>
    ),
    link: ({ children, value }: any) => (
      <a
        href={value.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-600 hover:text-primary-700 underline"
      >
        {children}
      </a>
    ),
  },
  list: {
    bullet: ({ children }: any) => (
      <ul className="space-y-4 mb-6">{children}</ul>
    ),
    number: ({ children }: any) => (
      <ol className="space-y-4 mb-6 list-decimal list-inside">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }: any) => (
      <li className="flex items-start">
        <span className="text-primary-600 font-bold text-xl mr-3">✓</span>
        <span className="text-lg">{children}</span>
      </li>
    ),
    number: ({ children }: any) => (
      <li className="text-lg">{children}</li>
    ),
  },
};

export default function PortableText({ value }: PortableTextProps) {
  return <PortableTextReact value={value} components={components} />;
}
