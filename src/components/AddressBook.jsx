import { useState } from 'react';
import { MapPin, Plus, Trash2, Edit3 } from 'lucide-react';
import Button from './Button';
import { useAuth } from '../context/AuthContext';

export default function AddressBook() {
  const { user } = useAuth();
  
  // Local state for demonstration. 
  // Normally this interacts with Firestore user.addresses array.
  const [addresses, setAddresses] = useState(user?.addresses || []);

  const addAddress = () => {
    alert("Add address form coming soon!");
  };

  if(!addresses || addresses.length === 0) {
      return (
        <div className="bg-white rounded-xl border border-border p-6 text-center py-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
               <MapPin size={32} />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">No addresses saved</h2>
            <p className="text-text-secondary mb-6">Add a delivery address to speed up your checkout process.</p>
            <Button variant="primary" icon={Plus} onClick={addAddress}>Add New Address</Button>
        </div>
      );
  }

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-text-primary">Saved Addresses</h2>
        <Button variant="secondary" size="sm" icon={Plus} onClick={addAddress}>Add New</Button>
      </div>
      <div className="space-y-4">
        {addresses.map((address, id) => (
          <div key={id} className="border border-border rounded-lg p-4 flex justify-between items-start">
            <div className="flex flex-col text-sm">
                <p className="font-semibold text-text-primary">{address.label || 'Home'}</p>
                <p className="text-text-secondary mt-1">{address.streetLine1}</p>
                {address.streetLine2 && <p className="text-text-secondary">{address.streetLine2}</p>}
                <p className="text-text-secondary">{address.city}, {address.state} {address.zip}</p>
            </div>
            <div className="flex gap-2">
                 <button className="text-primary hover:text-primary-dark p-2"><Edit3 size={16} /></button>
                 <button className="text-danger hover:text-danger-dark p-2"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
