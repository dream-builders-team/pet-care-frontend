import React, { createContext, useContext, useState, useEffect } from 'react';
import { getItem, setItem, initializeStorage, resetStorageToDemo, KEYS } from '../utils/localStorage';
import { SERVICES } from '../data/mockData';

const PetlyContext = createContext();

export const PetlyProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pets, setPets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [marketplacePets, setMarketplacePets] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize data on mount
  useEffect(() => {
    initializeStorage();
    const storedUser = getItem(KEYS.USER);
    const storedAuth = getItem(KEYS.AUTH, false);
    const storedPets = getItem(KEYS.PETS, []);
    const storedBookings = getItem(KEYS.BOOKINGS, []);
    const storedReminders = getItem(KEYS.REMINDERS, []);
    const storedMarketplace = getItem(KEYS.MARKETPLACE, []);

    setUser(storedUser);
    setIsAuthenticated(storedAuth);
    setPets(storedPets);
    setBookings(storedBookings);
    setReminders(storedReminders);
    setMarketplacePets(storedMarketplace);
    setLoading(false);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const login = (email, password) => {
    const storedUser = getItem(KEYS.USER);
    if (storedUser && storedUser.email.toLowerCase() === email.toLowerCase()) {
      if (storedUser.password === password || password === 'password123') {
        setIsAuthenticated(true);
        setItem(KEYS.AUTH, true);
        showToast(`Welcome back, ${storedUser.name}!`);
        return { success: true };
      } else {
        return { success: false, message: 'Invalid password. Try password123' };
      }
    } else {
      // Allow dynamic login with email if demo
      const newUser = {
        id: `usr_${Date.now()}`,
        name: email.split('@')[0].replace('.', ' '),
        email,
        phone: '+91 98765 43210',
        password
      };
      setUser(newUser);
      setIsAuthenticated(true);
      setItem(KEYS.USER, newUser);
      setItem(KEYS.AUTH, true);
      showToast(`Welcome to Petly, ${newUser.name}!`);
      return { success: true };
    }
  };

  const register = (userData) => {
    const newUser = {
      id: `usr_${Date.now()}`,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      createdAt: new Date().toISOString()
    };
    setUser(newUser);
    setIsAuthenticated(true);
    setItem(KEYS.USER, newUser);
    setItem(KEYS.AUTH, true);
    showToast('Account created successfully!');
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setItem(KEYS.AUTH, false);
    showToast('Logged out successfully', 'info');
  };

  const updateUserProfile = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    setItem(KEYS.USER, updatedUser);
    showToast('Profile updated successfully!');
  };

  // Pet management
  const addPet = (petData) => {
    const newPet = {
      id: `pet_${Date.now()}`,
      ...petData,
      vaccinationStatus: petData.vaccinationStatus || 'Vaccinated'
    };
    const updatedPets = [newPet, ...pets];
    setPets(updatedPets);
    setItem(KEYS.PETS, updatedPets);
    showToast(`${newPet.name} has been added to your pets!`);
    return newPet;
  };

  const updatePet = (petId, updatedData) => {
    const updatedPets = pets.map(p => p.id === petId ? { ...p, ...updatedData } : p);
    setPets(updatedPets);
    setItem(KEYS.PETS, updatedPets);
    showToast('Pet details updated!');
  };

  const deletePet = (petId) => {
    const petToDelete = pets.find(p => p.id === petId);
    const updatedPets = pets.filter(p => p.id !== petId);
    setPets(updatedPets);
    setItem(KEYS.PETS, updatedPets);
    showToast(`${petToDelete ? petToDelete.name : 'Pet'} removed`, 'info');
  };

  // Marketplace & Pet Selling Management
  const addMarketplaceListing = (listingData) => {
    const newListing = {
      id: `mkt_${Date.now()}`,
      ...listingData,
      sellerName: user?.name || 'Pet Owner',
      phone: listingData.phone || user?.phone || '+91 98765 43210',
      certified: true,
      vaccinated: true,
      createdAt: new Date().toISOString().split('T')[0]
    };
    const updatedMarketplace = [newListing, ...marketplacePets];
    setMarketplacePets(updatedMarketplace);
    setItem(KEYS.MARKETPLACE, updatedMarketplace);
    showToast(`Your pet listing "${newListing.title}" is now live!`);
    return newListing;
  };

  const buyMarketplacePet = (petListing) => {
    // Automatically add bought pet to user's "My Pets"
    const newPet = {
      id: `pet_${Date.now()}`,
      name: petListing.title.split(' ')[0],
      type: petListing.type,
      breed: petListing.breed,
      age: petListing.age,
      gender: petListing.gender || 'Male',
      weight: '5',
      vaccinationStatus: 'Vaccinated',
      image: petListing.image,
      notes: `Purchased/Adopted from ${petListing.sellerName}`
    };

    const updatedPets = [newPet, ...pets];
    setPets(updatedPets);
    setItem(KEYS.PETS, updatedPets);

    // Remove from marketplace or mark sold
    const updatedMarketplace = marketplacePets.filter(p => p.id !== petListing.id);
    setMarketplacePets(updatedMarketplace);
    setItem(KEYS.MARKETPLACE, updatedMarketplace);

    showToast(`Congratulations! ${newPet.name} has been added to your My Pets!`);
    return newPet;
  };

  // Booking & Payment management
  const addBooking = (bookingData) => {
    const selectedService = SERVICES.find(s => s.id === bookingData.serviceId) || SERVICES[0];
    const selectedPet = pets.find(p => p.id === bookingData.petId);

    const isPaid = bookingData.payNow || false;

    const newBooking = {
      id: `bk_${Date.now()}`,
      serviceId: bookingData.serviceId,
      serviceName: selectedService.name,
      petId: bookingData.petId,
      petName: selectedPet ? selectedPet.name : 'Pet',
      date: bookingData.date,
      time: bookingData.time,
      ownerName: bookingData.ownerName || user?.name || 'Pet Owner',
      phone: bookingData.phone || user?.phone || '',
      notes: bookingData.notes || '',
      price: selectedService.price,
      status: 'Confirmed',
      paymentStatus: isPaid ? 'Paid' : 'Unpaid',
      paymentMethod: bookingData.paymentMethod || (isPaid ? 'Credit Card' : 'Pay on Arrival'),
      transactionId: isPaid ? `TXN-${Math.floor(100000 + Math.random() * 900000)}` : null,
      paidAt: isPaid ? new Date().toISOString() : null,
      createdAt: new Date().toISOString()
    };

    const updatedBookings = [newBooking, ...bookings];
    setBookings(updatedBookings);
    setItem(KEYS.BOOKINGS, updatedBookings);
    showToast(`Booking for ${newBooking.serviceName} confirmed! ${isPaid ? 'Payment Received.' : ''}`);
    return newBooking;
  };

  const payForBooking = (bookingId, paymentDetails) => {
    const txnId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    const updatedBookings = bookings.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          paymentStatus: 'Paid',
          paymentMethod: paymentDetails.method || 'UPI / Card',
          transactionId: txnId,
          paidAt: new Date().toISOString(),
          status: 'Confirmed'
        };
      }
      return b;
    });

    setBookings(updatedBookings);
    setItem(KEYS.BOOKINGS, updatedBookings);
    showToast(`Payment of ₹${paymentDetails.amount} successful! Receipt #${txnId}`);
    return txnId;
  };

  const cancelBooking = (bookingId) => {
    const updatedBookings = bookings.map(b => {
      if (b.id === bookingId) {
        const isPaid = b.paymentStatus === 'Paid';
        return {
          ...b,
          status: 'Cancelled',
          paymentStatus: isPaid ? 'Refunded' : 'Cancelled'
        };
      }
      return b;
    });
    setBookings(updatedBookings);
    setItem(KEYS.BOOKINGS, updatedBookings);
    showToast('Booking cancelled', 'warning');
  };

  // Reminder management
  const addReminder = (reminderData) => {
    const selectedPet = pets.find(p => p.id === reminderData.petId);
    const newReminder = {
      id: `rem_${Date.now()}`,
      ...reminderData,
      petName: selectedPet ? selectedPet.name : 'All Pets',
      status: 'Active'
    };
    const updatedReminders = [newReminder, ...reminders];
    setReminders(updatedReminders);
    setItem(KEYS.REMINDERS, updatedReminders);
    showToast('Health reminder added!');
    return newReminder;
  };

  const deleteReminder = (reminderId) => {
    const updatedReminders = reminders.filter(r => r.id !== reminderId);
    setReminders(updatedReminders);
    setItem(KEYS.REMINDERS, updatedReminders);
    showToast('Reminder deleted', 'info');
  };

  const toggleReminderStatus = (reminderId) => {
    const updatedReminders = reminders.map(r => {
      if (r.id === reminderId) {
        const newStatus = r.status === 'Completed' ? 'Active' : 'Completed';
        return { ...r, status: newStatus };
      }
      return r;
    });
    setReminders(updatedReminders);
    setItem(KEYS.REMINDERS, updatedReminders);
    showToast('Reminder status updated!');
  };

  const resetAllData = () => {
    resetStorageToDemo();
    setUser(getItem(KEYS.USER));
    setIsAuthenticated(true);
    setPets(getItem(KEYS.PETS));
    setBookings(getItem(KEYS.BOOKINGS));
    setReminders(getItem(KEYS.REMINDERS));
    setMarketplacePets(getItem(KEYS.MARKETPLACE));
    showToast('Data reset to default demo values!', 'info');
  };

  return (
    <PetlyContext.Provider value={{
      user,
      isAuthenticated,
      pets,
      services: SERVICES,
      bookings,
      reminders,
      marketplacePets,
      toast,
      loading,
      login,
      register,
      logout,
      updateUserProfile,
      addPet,
      updatePet,
      deletePet,
      addMarketplaceListing,
      buyMarketplacePet,
      addBooking,
      payForBooking,
      cancelBooking,
      addReminder,
      deleteReminder,
      toggleReminderStatus,
      showToast,
      resetAllData
    }}>
      {children}
    </PetlyContext.Provider>
  );
};

export const usePetly = () => useContext(PetlyContext);
