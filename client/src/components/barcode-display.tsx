import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@shared/schema';
import QRCode from 'qrcode';

interface BarcodeDisplayProps {
  product: Product;
  className?: string;
}

export function BarcodeDisplay({ product, className }: BarcodeDisplayProps) {
  const qrCodeRef = useRef<HTMLCanvasElement>(null);
  const printableRef = useRef<HTMLDivElement>(null);

  // Generate QR code when component mounts
  useEffect(() => {
    if (qrCodeRef.current && product.productCode) {
      try {
        // Generate text-only QR code data (no URLs)
        const qrData = `🏷️ PALANIAPPA JEWELLERS
📋 Product Code: ${product.productCode}
💍 Product Name: ${product.name}
⚖️ Purity: ${product.purity || '22K'}
📊 Gross Weight: ${product.grossWeight} g
📈 Net Weight: ${product.netWeight} g
💎 Stone: ${product.stones || 'None'}
📉 Gold Rate: ${product.goldRateAtCreation ? `₹${product.goldRateAtCreation}/g` : 'N/A'}
💰 Approx Price: ₹${parseInt(product.priceInr).toLocaleString('en-IN')}

📞 Contact: +91 994 206 1393
💬 WhatsApp: +91 994 206 1393`;

        QRCode.toCanvas(qrCodeRef.current, qrData, {
          width: 200,
          margin: 4,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'H',
          scale: 8
        });
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    }
  }, [product.productCode, product.name, product.purity, product.grossWeight, product.netWeight, product.stones, product.goldRateAtCreation, product.priceInr]);

  const productType = product.name.split(' ')[0].toUpperCase();
  const grossWeight = `${product.grossWeight} g`;

  const handlePrint = async () => {
    // Generate text-only QR code data for printing (no URLs)
    const qrData = `🏷️ PALANIAPPA JEWELLERS
📋 Product Code: ${product.productCode}
💍 Product Name: ${product.name}
⚖️ Purity: ${product.purity || '22K'}
📊 Gross Weight: ${grossWeight}
📈 Net Weight: ${product.netWeight} g
💎 Stone: ${product.stones || 'None'}
📉 Gold Rate: ${product.goldRateAtCreation ? `₹${product.goldRateAtCreation}/g` : 'N/A'}
💰 Approx Price: ₹${parseInt(product.priceInr).toLocaleString('en-IN')}

📞 Contact: +91 994 206 1393
💬 WhatsApp: +91 994 206 1393`;

    try {
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 4,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H',
        scale: 8
      });

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Product Barcode - ${product.name}</title>
              <style>
                @page {
                  size: A4;
                  margin: 0.5in;
                }
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 0; 
                  padding: 10px; 
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  height: 100vh;
                  box-sizing: border-box;
                }
                .barcode-container { 
                  border: 3px solid #000; 
                  border-radius: 15px; 
                  padding: 25px; 
                  width: 350px; 
                  max-width: 90%;
                  text-align: center; 
                  background: white;
                  position: relative;
                  box-sizing: border-box;
                  page-break-inside: avoid;
                }
                .hole-dot {
                  position: absolute;
                  top: 12px;
                  right: 12px;
                  width: 18px;
                  height: 18px;
                  z-index: 10;
                }
                .hole-dot::before {
                  content: '●';
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  font-size: 18px;
                  color: #000 !important;
                  line-height: 1;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                .store-name { 
                  font-size: 18px; 
                  font-weight: bold; 
                  margin-bottom: 12px; 
                  letter-spacing: 1px;
                }
                .product-code-large { 
                  font-size: 24px; 
                  font-weight: bold; 
                  margin-bottom: 12px; 
                  font-family: monospace;
                }
                .product-info { 
                  font-size: 16px; 
                  font-weight: bold; 
                  margin-bottom: 12px; 
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                }
                .weight-info { 
                  font-size: 14px; 
                  font-weight: bold; 
                  margin-bottom: 15px; 
                }
                .barcode-area { 
                  margin: 15px 0; 
                  display: flex;
                  justify-content: center;
                }
                .qr-image {
                  width: 140px;
                  height: 140px;
                  max-width: 140px;
                  max-height: 140px;
                }
                .product-code-bottom { 
                  font-size: 16px; 
                  font-weight: bold; 
                  margin-top: 12px; 
                  font-family: monospace;
                }
              </style>
            </head>
            <body>
              <div class="barcode-container">
                <div class="hole-dot"></div>
                <div class="store-name">PALANIAPPA JEWELLERS</div>
                <div class="product-code-large">${product.productCode}</div>
                <div class="product-info">
                  <span>${productType}</span>
                  <span>${product.purity || '22K'}</span>
                </div>
                <div class="weight-info">Gross Weight : ${grossWeight}</div>
                <div class="barcode-area">
                  <img src="${qrCodeDataURL}" alt="QR Code" class="qr-image" />
                </div>
                <div class="product-code-bottom">${product.productCode}</div>
              </div>
              <script>
                // Print after a short delay to ensure image loads
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 500);
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (error) {
      console.error('Error generating QR code for print:', error);
      // Fallback: print without QR code
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Product Barcode - ${product.name}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                .barcode-container { border: 3px solid #000; border-radius: 15px; padding: 30px; width: 400px; text-align: center; background: white; position: relative; }
                .hole-dot { position: absolute; top: 15px; right: 15px; width: 20px; height: 20px; background-color: #000; border-radius: 50%; }
                .store-name { font-size: 20px; font-weight: bold; margin-bottom: 15px; }
                .product-code-large { font-size: 28px; font-weight: bold; margin-bottom: 15px; font-family: monospace; }
                .product-info { font-size: 18px; font-weight: bold; margin-bottom: 15px; display: flex; justify-content: space-between; }
                .weight-info { font-size: 16px; font-weight: bold; margin-bottom: 20px; }
                .product-code-bottom { font-size: 18px; font-weight: bold; margin-top: 15px; font-family: monospace; }
              </style>
            </head>
            <body>
              <div class="barcode-container">
                <div class="hole-dot"></div>
                <div class="store-name">PALANIAPPA JEWELLERS</div>
                <div class="product-code-large">${product.productCode}</div>
                <div class="product-info">
                  <span>${productType}</span>
                  <span>${product.purity || '22K'}</span>
                </div>
                <div class="weight-info">Gross Weight : ${grossWeight}</div>
                <div class="product-code-bottom">${product.productCode}</div>
              </div>
              <script>setTimeout(() => { window.print(); window.close(); }, 300);</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <QrCode className="h-5 w-5" />
          Product QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barcode Display matching the image style */}
        <div 
          ref={printableRef}
          className="border-2 border-black rounded-xl p-6 bg-white text-center max-w-sm mx-auto relative"
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          {/* Black dot for hanging hole */}
          <div className="absolute top-3 right-3 w-5 h-5 bg-black rounded-full"></div>
          
          {/* Store Name */}
          <div className="text-lg font-bold mb-3 tracking-wide">
            PALANIAPPA JEWELLERS
          </div>
          
          {/* Product Code (Large) */}
          <div className="text-2xl font-bold mb-3 font-mono">
            {product.productCode}
          </div>
          
          {/* Product Type and Purity */}
          <div className="text-lg font-bold mb-3 flex justify-between items-center">
            <span>{productType}</span>
            <span>{product.purity || '22K'}</span>
          </div>
          
          {/* Weight */}
          <div className="text-base font-bold mb-4">
            Gross Weight : {grossWeight}
          </div>
          
          {/* QR Code */}
          <div className="flex justify-center mb-4">
            <canvas ref={qrCodeRef} style={{ width: '150px', height: '150px' }}></canvas>
          </div>
          
          {/* Product Code (Bottom) */}
          <div className="text-lg font-bold font-mono">
            {product.productCode}
          </div>
        </div>

        {/* Print Button */}
        <Button 
          onClick={handlePrint}
          variant="outline" 
          className="w-full mt-4"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Barcode
        </Button>
      </CardContent>
    </Card>
  );
}

export default BarcodeDisplay;