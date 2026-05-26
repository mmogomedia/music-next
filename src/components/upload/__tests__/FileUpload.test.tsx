import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock HeroUI ripple + dom-animation before importing the component so HeroUI
// Buttons (used internally by FButton) don't try to dynamic-import framer
// motion features (which jest's jsdom env can't resolve without
// --experimental-vm-modules).
jest.mock('@heroui/dom-animation', () => ({
  __esModule: true,
  default: () => ({}),
}));

jest.mock('@heroui/ripple', () => ({
  useRipple: () => ({
    ripples: [],
    onPress: jest.fn(),
    onClear: jest.fn(),
  }),
  Ripple: () => null,
}));

import FileUpload from '../FileUpload';

// Mock Ably
jest.mock('ably', () => ({
  Realtime: jest.fn(() => ({
    channels: {
      get: jest.fn(() => ({
        subscribe: jest.fn(),
        publish: jest.fn(),
        unsubscribe: jest.fn(),
      })),
    },
  })),
}));

// Mock fetch
global.fetch = jest.fn();

const mockOnUploadComplete = jest.fn();

const renderFileUpload = (props = {}) => {
  return render(
    <FileUpload onUploadComplete={mockOnUploadComplete} {...props} />
  );
};

// The "Choose File" button in FileUpload triggers a hidden <input type="file" />
// via a ref. For testing we drive the hidden input directly with userEvent.upload.
const getFileInput = () =>
  document.querySelector('input[type="file"]') as HTMLInputElement;

describe('FileUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // mockReset (not just mockClear) so each test starts with a fresh
    // mockResolvedValueOnce queue and no leftover responses from prior cases.
    (fetch as jest.Mock).mockReset();
  });

  it('should render file upload component', () => {
    renderFileUpload();

    expect(screen.getByText('Drag & drop your music')).toBeInTheDocument();
    expect(
      screen.getByText('or click below to browse your files')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /choose file/i })
    ).toBeInTheDocument();
  });

  it('should handle file selection', async () => {
    const user = userEvent.setup();
    renderFileUpload();

    const file = new File(['test audio content'], 'test.mp3', {
      type: 'audio/mpeg',
    });
    const input = getFileInput();

    await user.upload(input, file);

    expect(screen.getByText('test.mp3')).toBeInTheDocument();
  });

  it('should show upload button when file is selected', async () => {
    const user = userEvent.setup();
    renderFileUpload();

    const file = new File(['test audio content'], 'test.mp3', {
      type: 'audio/mpeg',
    });
    const input = getFileInput();

    await user.upload(input, file);

    expect(
      screen.getByRole('button', { name: /upload track/i })
    ).toBeInTheDocument();
  });

  it('should handle successful upload flow', async () => {
    const user = userEvent.setup();

    // Mock successful API responses
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            jobId: 'test-job-id',
            uploadUrl: 'https://test-upload-url.com',
            key: 'test-key',
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    renderFileUpload();

    const file = new File(['test audio content'], 'test.mp3', {
      type: 'audio/mpeg',
    });
    const input = getFileInput();

    await user.upload(input, file);

    const uploadButton = screen.getByRole('button', { name: /upload track/i });
    await user.click(uploadButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/uploads/init',
        expect.any(Object)
      );
    });
  });

  it('should handle upload errors', async () => {
    const user = userEvent.setup();

    // Mock API error
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Upload failed'));

    renderFileUpload();

    const file = new File(['test audio content'], 'test.mp3', {
      type: 'audio/mpeg',
    });
    const input = getFileInput();

    await user.upload(input, file);

    const uploadButton = screen.getByRole('button', { name: /upload track/i });
    await user.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
    });
  });

  // NOTE: FileUpload performs no JS-level type/size validation in
  // handleFileSelect (see src/components/upload/FileUpload.tsx). The only
  // type filtering comes from the hidden input's `accept` attribute, and
  // size enforcement happens server-side at /api/uploads/init. The chips
  // ("Max 100 MB", format names) are display-only.
  it('restricts file picker to audio formats via the accept attribute', () => {
    renderFileUpload();
    const input = getFileInput();
    expect(input).toHaveAttribute(
      'accept',
      'audio/mpeg,audio/wav,audio/flac,audio/mp4,audio/aac'
    );
  });

  it('accepts large files (no client-side size validation)', async () => {
    const user = userEvent.setup();
    renderFileUpload();

    // 2 MB is large enough to be meaningful but keeps the test fast.
    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.mp3', {
      type: 'audio/mpeg',
    });
    const input = getFileInput();

    await user.upload(input, largeFile);

    expect(screen.getByText('large.mp3')).toBeInTheDocument();
    expect(
      screen.queryByText(/file size must be less than/i)
    ).not.toBeInTheDocument();
  });
});
