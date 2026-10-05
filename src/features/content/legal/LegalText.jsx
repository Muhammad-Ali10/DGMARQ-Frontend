import { useContext } from 'react';
import { LegalAnchorsContext } from './context';
import { parseInline } from './inline';
import { LINK } from './styles';

/** Renders one string of legal copy with its inline markup (see inline.js). */
const LegalText = ({ text }) => {
  const anchors = useContext(LegalAnchorsContext);

  return parseInline(text).map((token, i) => {
    switch (token.type) {
      case 'strong':
        return (
          <strong key={i} className="font-semibold text-fg">
            {token.value}
          </strong>
        );
      case 'email':
        return (
          <a key={i} href={`mailto:${token.value}`} className={LINK}>
            {token.value}
          </a>
        );
      case 'link':
        return (
          <a key={i} href={token.href} target="_blank" rel="noopener noreferrer" className={LINK}>
            {token.value}
          </a>
        );
      case 'section':
        return anchors.has(token.anchor) ? (
          <a key={i} href={`#${token.anchor}`} className={LINK}>
            {token.value}
          </a>
        ) : (
          token.value
        );
      default:
        return token.value;
    }
  });
};

export default LegalText;
