import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('FileUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('should render file upload component', () => {
    renderFileUpload();

    expect(screen.getByText('Upload your music')).toBeInTheDocument();
    expect(
      screen.getByText('Drag and drop files here, or click to select')
    ).toBeInTheDocument();
  });

  it('should handle file selection', async () => {
    const user = userEvent.setup();
    renderFileUpload();

    const file = new File(['test audio content'], 'test.mp3', {
      type: 'audio/mpeg',
    });
    const input = screen.getByRole('button', { name: /choose files/i });

    await user.upload(input, file);

    expect(screen.getByText('test.mp3')).toBeInTheDocument();
  });

  it('should show upload button when file is selected', async () => {
    const user = userEvent.setup();
    renderFileUpload();

    const file = new File(['test audio content'], 'test.mp3', {
      type: 'audio/mpeg',
    });
    const input = screen.getByRole('button', { name: /choose files/i });

    await user.upload(input, file);

    expect(screen.getByText('Upload to Cloud Storage')).toBeInTheDocument();
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
    const input = screen.getByRole('button', { name: /choose files/i });

    await user.upload(input, file);

    const uploadButton = screen.getByText('Upload to Cloud Storage');
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
    const input = screen.getByRole('button', { name: /choose files/i });

    await user.upload(input, file);

    const uploadButton = screen.getByText('Upload to Cloud Storage');
    await user.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
    });
  });

  it('should validate file type', async () => {
    const user = userEvent.setup();
    renderFileUpload();

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByRole('button', { name: /choose files/i });

    await user.upload(input, file);

    expect(
      screen.getByText(/please select a valid audio file/i)
    ).toBeInTheDocument();
  });

  it('should validate file size', async () => {
    const user = userEvent.setup();
    renderFileUpload();

    // Create a large file (100MB)
    const largeFile = new File(['x'.repeat(100 * 1024 * 1024)], 'large.mp3', {
      type: 'audio/mpeg',
    });
    const input = screen.getByRole('button', { name: /choose files/i });

    await user.upload(input, largeFile);

    expect(
      screen.getByText(/file size must be less than 50mb/i)
    ).toBeInTheDocument();
  });
});
