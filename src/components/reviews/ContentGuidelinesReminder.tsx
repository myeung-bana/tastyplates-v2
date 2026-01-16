import Link from 'next/link';
import { CONTENT_GUIDELINES } from '@/constants/pages';
import { FiInfo } from 'react-icons/fi';

export default function ContentGuidelinesReminder() {
  return (
    <div className="w-full bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 font-neusans">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <FiInfo className="w-5 h-5 text-orange-600" />
        </div>
        <div className="flex-1">
          <p className="text-orange-800 text-sm leading-relaxed">
            Before you submit, please ensure your review follows our{' '}
            <Link 
              href={CONTENT_GUIDELINES}
              className="font-medium text-orange-700 hover:text-orange-900 underline underline-offset-2 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Content Guidelines
            </Link>
            {' '}for a respectful and authentic community experience.
          </p>
        </div>
      </div>
    </div>
  );
}
