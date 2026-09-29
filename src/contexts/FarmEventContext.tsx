import React, { createContext, useContext, useState, useEffect } from 'react';
import { callAiJson } from '../lib/aiProvider';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';

export type EventCategory = 'Crop' | 'Water' | 'Livestock' | 'Finance' | 'Urgent' | 'General' | 'Weather';
export type EventStatus = 'Pending' | 'Completed' | 'Overdue';
export type EventPriority = 'Low' | 'Medium' | 'High';

export interface FarmEvent {
  id: string;
  title: string;
  subtitle?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  category: EventCategory;
  priority: EventPriority;
  status: EventStatus;
  moduleLink?: string;
  preparation?: string[];
}

interface FarmEventContextType {
  events: FarmEvent[];
  addEvent: (event: Omit<FarmEvent, 'id'>) => void;
  toggleCompletion: (id: string) => void;
  rescheduleEvent: (id: string, newDate: string, newTime: string) => void;
  generateAiPlanForDay: (date: string) => Promise<void>;
  generateWeatherRecommendations: (date: string, weatherDetails: string) => Promise<void>;
}

const FarmEventContext = createContext<FarmEventContextType | undefined>(undefined);

export function FarmEventProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<FarmEvent[]>([]);

  // Initialize with some mock data reflecting a busy farm day
  useEffect(() => {

      const generatedEvents: FarmEvent[] = [];
      const baseDate = new Date();
      let eventId = 1;

      for (let i = -7; i <= 7; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + i);
        const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        
        if (i < 0) {
          // Past days (Completed)
          generatedEvents.push({ id: String(eventId++), title: 'Morning Feed', subtitle: 'Cattle & Goats', date: dateStr, time: '06:30 AM', category: 'Livestock', priority: 'Medium', status: 'Completed' });
          generatedEvents.push({ id: String(eventId++), title: 'Irrigate Fields', subtitle: 'Rice & Wheat Fields', date: dateStr, time: '08:00 AM', category: 'Water', priority: 'Medium', status: 'Completed' });
          generatedEvents.push({ id: String(eventId++), title: 'Evening Feed', subtitle: 'Pigs & Cattle', date: dateStr, time: '05:30 PM', category: 'Livestock', priority: 'Medium', status: 'Completed' });
        } else if (i === 0) {
          // TODAY - 3 clean, factual tasks
          generatedEvents.push({ id: String(eventId++), title: 'Morning Feed', subtitle: 'Cattle, Goats & Pigs', date: dateStr, time: '06:30 AM', category: 'Livestock', priority: 'High', status: 'Pending' });
          generatedEvents.push({ id: String(eventId++), title: 'Irrigate Fields', subtitle: 'Rice & Sugarcane Plots', date: dateStr, time: '08:00 AM', category: 'Water', priority: 'High', status: 'Overdue', preparation: ['Check canal pump valve'] });
          generatedEvents.push({ id: String(eventId++), title: 'Evening Feed', subtitle: 'Cattle & Goats', date: dateStr, time: '05:30 PM', category: 'Livestock', priority: 'Medium', status: 'Pending' });
        } else {
          // Future Days (Low/Medium priority, only 1-2 per day)
          generatedEvents.push({ id: String(eventId++), title: 'Morning Feed', subtitle: 'Cattle & Pigs', date: dateStr, time: '06:30 AM', category: 'Livestock', priority: 'Low', status: 'Pending' });
          if (i % 2 === 0) {
            generatedEvents.push({ id: String(eventId++), title: 'Field Inspection', subtitle: 'Wheat & Rice Fields', date: dateStr, time: '10:00 AM', category: 'Crop', priority: 'Medium', status: 'Pending' });
          } else {
            generatedEvents.push({ id: String(eventId++), title: 'Evening Feed', subtitle: 'Cattle & Goats', date: dateStr, time: '05:30 PM', category: 'Livestock', priority: 'Low', status: 'Pending' });
          }
        }
      }
      
      setEvents(generatedEvents);
    }, []);

  const addEvent = (event: Omit<FarmEvent, 'id'>) => {
    setEvents(prev => [...prev, { ...event, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const toggleCompletion = (id: string) => {
    setEvents(prev => prev.map(e => {
      if (e.id === id) {
        return { ...e, status: e.status === 'Completed' ? 'Pending' : 'Completed' };
      }
      return e;
    }));
  };

  const rescheduleEvent = (id: string, newDate: string, newTime: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, date: newDate, time: newTime, status: 'Pending' } : e));
  };

  const generateAiPlanForDay = async (date: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const crops = user?.user_metadata?.inventory?.crops?.join(", ") || "No specific crops listed";
      const livestock = user?.user_metadata?.inventory?.livestock?.join(", ") || "No livestock listed";
      const location = user?.user_metadata?.location || "Unknown location";

      const currentTasks = events.filter(e => e.date === date).map(e => e.time + ': ' + e.title).join(', ');
      
      const prompt = `
        You are an expert farm AI manager. Analyze my entire farm and generate a comprehensive daily plan for ${date}.
        My Farm Profile:
        - Location: ${location}
        - Crops: ${crops}
        - Livestock: ${livestock}
        - Already Scheduled Tasks: [${currentTasks || 'None'}]
        
        Analyze the full farm. Generate exactly 4 critical tasks I should do today, covering different areas like Crop Management, Irrigation, Livestock Care, and Preventative Medicine/Health.
        Make the tasks highly specific to my crops and livestock.
        
        Return a JSON array of objects with this exact structure:
        [{
          "title": "String (Specific Task title)",
          "subtitle": "String (Short reasoning/context)",
          "time": "String (HH:MM AM/PM format, spaced out across the day)",
          "category": "String (Must be exactly one of: 'Crop', 'Water', 'Livestock', 'Finance', 'General')",
          "priority": "String (Must be 'Low', 'Medium', or 'High')"
        }]
      `;
      
      const res = await callAiJson(prompt, [
        { "title": "Check Soil Moisture", "subtitle": "AI Suggestion for Crops", "time": "08:00 AM", "category": "Crop", "priority": "High" },
        { "title": "Monitor Livestock Health", "subtitle": "Preventative check", "time": "10:00 AM", "category": "Livestock", "priority": "Medium" },
        { "title": "Review Irrigation System", "subtitle": "Water efficiency check", "time": "02:00 PM", "category": "Water", "priority": "High" },
        { "title": "Review local market prices", "subtitle": "Market intelligence", "time": "05:00 PM", "category": "Finance", "priority": "Medium" }
      ], true);

      if (res && Array.isArray(res)) {
        res.forEach(item => {
          addEvent({
            title: item.title,
            subtitle: item.subtitle,
            date: date,
            time: item.time,
            category: item.category as EventCategory,
            priority: item.priority as EventPriority,
            status: 'Pending',
            preparation: ['AI Generated Plan']
          });
        });
        Alert.alert("Farm AI Complete", `Generated a comprehensive full-farm plan. Added ${res.length} smart tasks to your schedule for ${date}.`);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not generate AI plan.");
    }
  };

  const generateWeatherRecommendations = async (date: string, weatherDetails: string) => {
    try {
      const dateEvents = events.filter(e => e.date === date);
      const prompt = `
        You are a farm weather AI. The forecast for ${date} is: "${weatherDetails}".
        The farmer has these tasks: ${JSON.stringify(dateEvents.map(e => e.title + ' (' + e.category + ')'))}
        
        Generate 1-2 critical recommendation events based on how this weather affects the scheduled tasks.
        For example, if it's raining, recommend canceling irrigation. If it's windy, warn about spraying.
        
        Return a JSON array:
        [{
          "title": "String (The recommendation, e.g., 'Review Irrigation Schedule')",
          "subtitle": "String (Reasoning, e.g., 'Rain expected, save water')",
          "time": "String (e.g., '07:00 AM')",
          "priority": "String (Must be 'High' or 'Medium')"
        }]
      `;
      
      const res = await callAiJson(prompt, [{ "title": "Review local market prices", "subtitle": "AI Suggestion", "time": "02:00 PM", "category": "General", "priority": "Medium" }], true);
      if (res && Array.isArray(res)) {
        res.forEach(item => {
          addEvent({
            title: item.title,
            subtitle: item.subtitle,
            date: date,
            time: item.time,
            category: 'Weather',
            priority: item.priority as EventPriority,
            status: 'Pending'
          });
        });
        Alert.alert("Weather Recommendations", `Added AI weather recommendations based on: ${weatherDetails}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <FarmEventContext.Provider value={{ events, addEvent, toggleCompletion, rescheduleEvent, generateAiPlanForDay, generateWeatherRecommendations }}>
      {children}
    </FarmEventContext.Provider>
  );
}

export function useFarmEvents() {
  const context = useContext(FarmEventContext);
  if (context === undefined) {
    throw new Error('useFarmEvents must be used within a FarmEventProvider');
  }
  return context;
}
