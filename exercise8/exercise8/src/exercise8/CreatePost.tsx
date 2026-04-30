import React, { useState, useRef } from 'react';
import { Image, Smile, MapPin, X } from 'lucide-react';
import { User } from './types';
import UserAvatar from './UserAvatar';

interface Props {
  currentUser: User;
  onCreatePost: (content: string, imageUrl?: string) => void;
}

const IMAGE_SEEDS = ['nature', 'city', 'technology', 'architecture', 'travel', 'food', 'art'];

const CreatePost: React.FC<Props> = ({ currentUser, onCreatePost }) => {
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFocus = () => setIsExpanded(true);

  const handleSubmit = () => {
    if (!content.trim()) return;
    onCreatePost(content.trim(), imagePreview ?? undefined);
    setContent('');
    setImagePreview(null);
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleAddImage = () => {
    const seed = IMAGE_SEEDS[Math.floor(Math.random() * IMAGE_SEEDS.length)];
    setImagePreview(`https://picsum.photos/seed/${seed}${Date.now()}/600/400`);
  };

  const canSubmit = content.trim().length > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex gap-3">
        <UserAvatar user={currentUser} size="md" />
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder="What's on your mind?"
            rows={isExpanded ? 3 : 1}
            className="w-full resize-none text-gray-800 placeholder-gray-400 text-[15px] focus:outline-none leading-relaxed"
          />

          {imagePreview && (
            <div className="relative mt-2 rounded-xl overflow-hidden border border-gray-100">
              <img
                src={imagePreview}
                alt="preview"
                className="w-full h-48 object-cover"
              />
              <button
                onClick={() => setImagePreview(null)}
                className="absolute top-2 right-2 bg-gray-900/60 text-white rounded-full p-1 hover:bg-gray-900/80 transition-colors"
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {isExpanded && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-0.5">
                <button
                  onClick={handleAddImage}
                  className="flex items-center gap-1.5 text-indigo-500 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                >
                  <Image size={16} />
                  <span>Photo</span>
                </button>
                <button className="flex items-center gap-1.5 text-yellow-500 hover:bg-yellow-50 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium">
                  <Smile size={16} />
                  <span>Feeling</span>
                </button>
                <button className="flex items-center gap-1.5 text-green-500 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium">
                  <MapPin size={16} />
                  <span>Location</span>
                </button>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  canSubmit
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Post
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
