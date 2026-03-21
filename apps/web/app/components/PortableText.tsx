import { PortableText as PortableTextReact } from '@portabletext/react';
import { Icon } from './Icon';

interface PortableTextProps {
  value: any;
  variant?: 'light' | 'dark';
}

function createComponents(dark: boolean) {
  return {
    block: {
      h1: ({ children }: any) => (
        <h1 className={`text-4xl md:text-5xl lg:text-6xl font-black mb-8 mt-16 first:mt-0 uppercase tracking-tight leading-tight ${dark ? 'text-white' : 'text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-primary-700 to-primary-600'}`}>
          {children}
        </h1>
      ),
      h2: ({ children }: any) => (
        <h2 className={`text-3xl md:text-4xl lg:text-5xl font-black mb-4 mt-16 first:mt-0 tracking-tight border-l-4 border-accent-500 pl-6 leading-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
          {children}
        </h2>
      ),
      h3: ({ children }: any) => (
        <h3 className={`text-2xl md:text-3xl font-bold mb-4 mt-4 tracking-tight ${dark ? 'text-white/90' : 'text-gray-900'}`}>
          {children}
        </h3>
      ),
      normal: ({ children }: any) => (
        <p className={`text-base md:text-lg leading-relaxed mb-4 ${dark ? 'text-white/75' : 'text-gray-700'}`}>
          {children}
        </p>
      ),
    },
    marks: {
      strong: ({ children }: any) => (
        <strong className={`font-extrabold ${dark ? 'text-primary-300' : 'text-primary-600'}`}>{children}</strong>
      ),
      em: ({ children }: any) => (
        <em className={`not-italic font-medium ${dark ? 'text-primary-300' : 'text-primary-600'}`}>{children}</em>
      ),
      link: ({ children, value }: any) => (
        <a
          href={value.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline decoration-2 underline-offset-4 font-semibold transition-colors ${dark ? 'text-primary-300 hover:text-primary-200' : 'text-primary-600 hover:text-primary-800'}`}
        >
          {children}
        </a>
      ),
    },
    list: {
      bullet: ({ children }: any) => (
        <ul className={`space-y-4 mb-8 mt-6 p-6 border-l-4 border-accent-500 ${dark ? 'bg-white/5' : 'bg-gradient-to-br from-gray-50 to-accent-50'}`}>{children}</ul>
      ),
      number: ({ children }: any) => (
        <ol className={`space-y-4 mb-8 mt-6 p-6 border-l-4 border-accent-500 list-decimal list-inside ${dark ? 'bg-white/5' : 'bg-gradient-to-br from-gray-50 to-accent-50'}`}>{children}</ol>
      ),
    },
    listItem: {
      bullet: ({ children }: any) => (
        <li className="flex items-start group">
          <span className="text-accent-500 font-black text-xl mr-4 shrink-0 mt-0.5 group-hover:scale-110 transition-transform"><Icon name="check" /></span>
          <span className={`text-base md:text-lg font-medium leading-relaxed ${dark ? 'text-white/80' : 'text-gray-800'}`}>{children}</span>
        </li>
      ),
      number: ({ children }: any) => (
        <li className={`text-base md:text-lg font-medium ${dark ? 'text-white/80' : 'text-gray-800'}`}>{children}</li>
      ),
    },
  };
}

export default function PortableText({ value, variant = 'light' }: PortableTextProps) {
  const components = createComponents(variant === 'dark');
  return <PortableTextReact value={value} components={components} />;
}
