import { useState } from "react";
import type { ReactNode, TouchEvent } from "react";
import { Icon } from "~/components/Icon";

type LightboxInteractionTag = {
  participant_id: string;
  participant?: { first_name: string; last_name: string };
};

type LightboxInteractionBuddy = {
  id: string;
  first_name: string;
  last_name: string;
};

type LightboxInteractions = {
  likeCount: number;
  liked: boolean;
  onLike: () => void;
  tags: LightboxInteractionTag[];
  tagOptions?: LightboxInteractionBuddy[];
  onToggleTag?: (buddyId: string) => void;
  isSubmitting?: boolean;
  tagLabel?: string;
};

type LightboxProps = {
  imageSrc: string;
  imageAlt?: string;
  onClose?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  showNav?: boolean;
  overlays?: ReactNode;
  footer?: ReactNode;
  interactions?: LightboxInteractions;
  backdrop?: boolean;
  backdropClassName?: string;
  wrapperClassName?: string;
  contentClassName?: string;
  imageWrapperClassName?: string;
  imageClassName?: string;
  footerClassName?: string;
  onTouchStart?: (event: TouchEvent) => void;
  onTouchMove?: (event: TouchEvent) => void;
  onTouchEnd?: (event: TouchEvent) => void;
};

export function Lightbox({
  imageSrc,
  imageAlt,
  onClose,
  onPrev,
  onNext,
  showNav,
  overlays,
  footer,
  interactions,
  backdrop = true,
  backdropClassName,
  wrapperClassName,
  contentClassName,
  imageWrapperClassName,
  imageClassName,
  footerClassName,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: LightboxProps) {
  const [showTagging, setShowTagging] = useState(false);
  const shouldShowNav = Boolean(showNav && onPrev && onNext);
  const wrapperClasses = backdrop
    ? backdropClassName ||
      "fixed inset-0 bg-black/90 z-[1200] flex items-center justify-center p-4 backdrop-blur-sm"
    : wrapperClassName || "relative";

  const contentClasses = contentClassName || "max-w-4xl w-full touch-pan-y px-2 sm:px-4";
  const imageWrapperClasses = imageWrapperClassName || "relative mx-auto";
  const imageClasses =
    imageClassName ||
    "max-h-[70vh] max-w-[90vw] h-auto w-auto mx-auto rounded-lg shadow-2xl object-contain";
  const footerClasses = footerClassName || "mt-6 space-y-4";

  const content = (
    <div
      className={contentClasses}
      onClick={(event) => event.stopPropagation()}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className={imageWrapperClasses}>
        <img src={imageSrc} alt={imageAlt || "Rally foto"} className={imageClasses} />
        {overlays}

        {interactions && (
          <>
            {interactions.tags.length > 0 && (
              <div className="absolute bottom-12 left-2 flex flex-wrap gap-2 max-w-[70%]">
                {interactions.tags.map((tag) => (
                  <span
                    key={tag.participant_id}
                    className="bg-black/70 text-white px-2 py-1 rounded-full text-xs"
                  >
                    {tag.participant?.first_name} {tag.participant?.last_name}
                  </span>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={interactions.onLike}
              disabled={interactions.isSubmitting}
              className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-semibold hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              <Icon
                name="heart"
                className={`w-4 h-4 transition-colors ${
                  interactions.liked ? "fill-red-500 text-red-500" : "text-white/80"
                }`}
              />
              {interactions.likeCount}
            </button>

            {interactions.tagOptions && interactions.onToggleTag && (
              <div className="absolute bottom-2 right-2">
                <button
                  type="button"
                  onClick={() => setShowTagging((prev) => !prev)}
                  className="flex items-center gap-2 bg-black/70 hover:bg-black/80 text-white px-3 py-1.5 rounded-full text-sm font-semibold transition-colors"
                >
                  <Icon name="user-plus" className="w-4 h-4" />
                  {showTagging ? "Sluiten" : interactions.tagLabel || "Tag"}
                </button>

                {showTagging && (
                  <div className="absolute bottom-full right-0 mb-2 w-56 max-h-56 overflow-y-auto bg-black/80 backdrop-blur-md rounded-lg shadow-2xl">
                    <div className="p-2 space-y-2">
                      {interactions.tagOptions.length === 0 ? (
                        <p className="text-white/70 text-sm px-2 py-3 text-center">Geen buddies om te taggen</p>
                      ) : (
                        interactions.tagOptions.map((buddy) => {
                          const isTagged = interactions.tags.some(
                            (tag) => tag.participant_id === buddy.id
                          );
                          return (
                            <button
                              key={buddy.id}
                              type="button"
                              onClick={() => interactions.onToggleTag?.(buddy.id)}
                              disabled={interactions.isSubmitting}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                                isTagged
                                  ? "bg-white/10 text-white"
                                  : "bg-white/5 hover:bg-white/10 text-white"
                              }`}
                            >
                              <Icon name="user" className="w-4 h-4" />
                              <span>{buddy.first_name} {buddy.last_name}</span>
                              {isTagged && <Icon name="check" className="w-4 h-4 ml-auto" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      {footer && <div className={footerClasses}>{footer}</div>}
    </div>
  );

  return (
    <div className={wrapperClasses} onClick={backdrop ? onClose : undefined}>
      {onClose && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          className="absolute top-2 sm:top-4 right-2 sm:right-4 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
          aria-label="Sluiten"
        >
          <Icon name="x" className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

      {shouldShowNav && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onPrev?.();
            }}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
            aria-label="Vorige"
          >
            <Icon name="chevron-left" className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onNext?.();
            }}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
            aria-label="Volgende"
          >
            <Icon name="chevron-right" className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </>
      )}

      {content}
    </div>
  );
}
