import React, { createContext, useContext, useState } from 'react';
import { emergencyAPI } from '../services/api';

const EmergencyModalContext = createContext(null);

export const EmergencyModalProvider = ({ children }) => {
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [emergencyPayload, setEmergencyPayload] = useState(null);
  const [isTriggeringSOS, setIsTriggeringSOS] = useState(false);

  const openEmergencyModal = (data) => {
    setEmergencyPayload(data);
    setIsEmergencyOpen(true);
  };

  const closeEmergencyModal = () => {
    setIsEmergencyOpen(false);
  };

  const triggerDirectSOS = async (symptoms = 'One-Touch Emergency SOS Button Activated') => {
    setIsTriggeringSOS(true);
    try {
      // Get current location if browser allows
      let coords = { lat: 37.7749, lng: -122.4194 };
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 })
          );
          coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch (e) {
          // Fallback to default hospital location
        }
      }

      const res = await emergencyAPI.triggerSOS({
        symptoms: [symptoms],
        location: coords
      });

      if (res.data.success) {
        setEmergencyPayload({
          incident: res.data.incident,
          triage: res.data.triage,
          isLiveSOS: true
        });
        setIsEmergencyOpen(true);
      }
    } catch (err) {
      console.error('SOS direct trigger error:', err);
      // Open modal in fallback emergency state
      setEmergencyPayload({
        triage: {
          agentName: 'Emergency Triage Agent',
          details: {
            detectedFlags: 'Manual SOS Triggered',
            urgentInstructions: [
              'Call 911 / 112 / 108 immediately.',
              'Proceed to your nearest hospital maternity ward.',
              'Notify your emergency contact right now.'
            ],
            hospital: {
              name: 'St. Jude Women & Children Memorial Hospital',
              phone: '+1 (555) 911-MATERNITY',
              address: '450 Healthcare Blvd, Suite 100'
            },
            emergencyContact: {
              name: 'Marcus Vance',
              phone: '+1 (555) 789-0123'
            }
          }
        },
        isLiveSOS: true
      });
      setIsEmergencyOpen(true);
    } finally {
      setIsTriggeringSOS(false);
    }
  };

  return (
    <EmergencyModalContext.Provider
      value={{
        isEmergencyOpen,
        emergencyPayload,
        isTriggeringSOS,
        openEmergencyModal,
        closeEmergencyModal,
        triggerDirectSOS
      }}
    >
      {children}
    </EmergencyModalContext.Provider>
  );
};

export const useEmergencyModal = () => useContext(EmergencyModalContext);
