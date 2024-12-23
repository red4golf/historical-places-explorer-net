import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';

export function Providers({ children }) {
  return (
    <Dialog.Root>
      {children}
    </Dialog.Root>
  );
}

export default Providers;