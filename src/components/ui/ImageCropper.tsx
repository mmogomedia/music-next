'use client';

import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from 'react-image-crop';
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  onCrop: (_croppedImageBlob: Blob) => void;
  imageSrc: string;
  aspectRatio?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export default function ImageCropper({
  isOpen,
  onClose,
  onCrop,
  imageSrc,
  aspectRatio = 1, // Square by default
  minWidth = 500,
  minHeight = 500,
  maxWidth = 1000,
  maxHeight = 1000,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;

      // Create a square crop in the center
      const crop = centerCrop(
        makeAspectCrop(
          {
            unit: 'px',
            width: Math.min(width, height, maxWidth),
          },
          aspectRatio,
          width,
          height
        ),
        width,
        height
      );

      setCrop(crop);
    },
    [aspectRatio, maxWidth]
  );

  const onCropChange = useCallback((crop: Crop) => {
    setCrop(crop);
  }, []);

  const onCropComplete = useCallback((crop: PixelCrop) => {
    setCompletedCrop(crop);
  }, []);

  const handleCrop = async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      return;
    }

    setIsProcessing(true);

    try {
      const canvas = canvasRef.current;
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      // Set canvas size to the crop size
      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;

      // Draw the cropped image
      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      );

      // Convert to blob
      canvas.toBlob(
        blob => {
          if (blob) {
            onCrop(blob);
            onClose();
          }
        },
        'image/jpeg',
        0.9
      );
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size='5xl'
      scrollBehavior='inside'
    >
      <ModalContent>
        <ModalHeader className='flex flex-col gap-1'>
          <h3 className='text-lg font-semibold'>Crop Your Image</h3>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            Adjust the crop area to create a square image ({minWidth}x
            {minHeight} to {maxWidth}x{maxHeight}px)
          </p>
        </ModalHeader>
        <ModalBody>
          <div className='flex justify-center'>
            <ReactCrop
              crop={crop}
              onChange={onCropChange}
              onComplete={onCropComplete}
              aspect={aspectRatio}
              minWidth={minWidth}
              minHeight={minHeight}
              maxWidth={maxWidth}
              maxHeight={maxHeight}
            >
              <img
                ref={imgRef}
                alt='Crop me'
                src={imageSrc}
                onLoad={onImageLoad}
                className='max-h-96 w-auto'
              />
            </ReactCrop>
          </div>
          <canvas
            ref={canvasRef}
            style={{
              display: 'none',
            }}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            variant='light'
            onPress={handleClose}
            startContent={<XMarkIcon className='w-4 h-4' />}
          >
            Cancel
          </Button>
          <Button
            color='primary'
            onPress={handleCrop}
            isLoading={isProcessing}
            startContent={
              !isProcessing ? <CheckIcon className='w-4 h-4' /> : undefined
            }
          >
            {isProcessing ? 'Processing...' : 'Crop Image'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
