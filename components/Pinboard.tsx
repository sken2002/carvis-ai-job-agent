
import React, { useState, useEffect, useMemo } from 'react';
import { Pin, NetworkContact, User } from '../types';
import Card from './common/Card';
import BackButton from './common/BackButton';
import { generateNetworkingTools } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';

interface PinboardProps {
  pins: Pin[];
  onUpdatePins: (pins: Pin[]) => void;
  networkContacts: NetworkContact[];
  onUpdateContacts: (contacts: NetworkContact[]) => void;
  onBack: () => void;
  user: User; // Added user prop for AI generation
}

const PinCard: React.FC<{
  pin: Pin;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string, content: string) => void;
}> = ({ pin, onDelete, onUpdate }) => {
  const [copyText, setCopyText] = useState('Copy');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(pin.title);
  const [editContent, setEditContent] = useState(pin.content);

  const handleCopy = () => {
    navigator.clipboard.writeText(pin.content).then(() => {
      setCopyText('Copied!');
      setTimeout(() => setCopyText('Copy'), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      setCopyText('Failed');
       setTimeout(() => setCopyText('Copy'), 2000);
    });
  };

  const handleSave = () => {
      onUpdate(pin.id, editTitle, editContent);
      setIsEditing(false);
  }

  if (isEditing) {
      return (
        <Card className="flex flex-col">
            <input 
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full p-2 mb-2 font-semibold text-lg bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-600"
            />
            <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 h-40 font-sans text-sm bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-600"
                rows={5}
            />
            <div className="mt-4 flex space-x-2">
                <button onClick={handleSave} className="px-4 py-2 text-sm bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700">Save</button>
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm bg-slate-200 dark:bg-slate-600 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">Cancel</button>
            </div>
        </Card>
      );
  }

  return (
    <Card>
      <div className="flex justify-between items-start">
        <h4 className="text-lg font-bold text-primary-700 dark:text-primary-400 mb-2 flex-1 pr-4">{pin.title}</h4>
        <div className="flex-shrink-0 flex space-x-2">
           <button onClick={() => setIsEditing(true)} className="text-sm font-semibold text-slate-500 hover:text-primary-600 dark:hover:text-primary-400">Edit</button>
           <button onClick={() => onDelete(pin.id)} className="text-sm font-semibold text-slate-500 hover:text-red-600 dark:hover:text-red-400">Delete</button>
        </div>
      </div>
      <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md my-2">{pin.content}</pre>
      <button
        onClick={handleCopy}
        className={`mt-2 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
          copyText === 'Copied!' 
          ? 'bg-green-500 text-white' 
          : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
        }`}
      >
        {copyText}
      </button>
    </Card>
  );
};

const NetworkContactCard: React.FC<{
  contact: NetworkContact;
  user: User;
  onDelete: (id: string) => void;
  onUpdate: (contact: NetworkContact) => void;
}> = ({ contact, user, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState(contact);
  
  // AI State
  const [generatedTools, setGeneratedTools] = useState<{ message: string, topics: string[] } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditState(prev => ({ ...prev, [name]: value }));
  }

  const handleSave = () => {
    onUpdate(editState);
    setIsEditing(false);
  }

  const handleGenerateTools = async () => {
      setIsGenerating(true);
      try {
          const tools = await generateNetworkingTools(user, contact);
          setGeneratedTools(tools);
      } catch (error) {
          console.error("Failed to generate tools", error);
      } finally {
          setIsGenerating(false);
      }
  }

  if (isEditing) {
    return (
      <Card>
        <div className="space-y-3">
          <label className="block text-xs font-medium text-slate-500 uppercase">Name</label>
          <input name="name" value={editState.name} onChange={handleChange} placeholder="Name" className="w-full p-2 font-semibold text-lg bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-600" />
          
          <div className="grid grid-cols-2 gap-2">
            <div>
                 <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Company</label>
                 <input name="company" value={editState.company} onChange={handleChange} placeholder="Company" className="w-full p-2 text-sm bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-600" />
            </div>
            <div>
                 <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Role</label>
                 <input name="role" value={editState.role} onChange={handleChange} placeholder="Role" className="w-full p-2 text-sm bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-600" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
              <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Event / Context</label>
                  <input name="event" value={editState.event} onChange={handleChange} placeholder="e.g. Tech Trek, Career Fair" className="w-full p-2 text-sm bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-600" />
              </div>
              <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Date Contacted</label>
                  <input name="dateContacted" type="date" value={editState.dateContacted} onChange={handleChange} placeholder="Date Contacted" className="w-full p-2 text-sm bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-600" />
              </div>
          </div>
          
          <label className="block text-xs font-medium text-slate-500 uppercase">Notes</label>
          <textarea name="notes" value={editState.notes} onChange={handleChange} placeholder="Notes" rows={4} className="w-full p-2 text-sm font-sans bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-600" />
          
          <div className="flex space-x-2 pt-2">
            <button onClick={handleSave} className="px-4 py-2 text-sm bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700">Save</button>
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm bg-slate-200 dark:bg-slate-600 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">Cancel</button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-4">
          <h4 className="text-lg font-bold text-primary-700 dark:text-primary-400">{contact.name}</h4>
          <p className="font-semibold text-slate-700 dark:text-slate-300">{contact.role} at {contact.company}</p>
          <div className="flex flex-wrap items-center gap-x-4 mt-1 text-sm text-slate-500 dark:text-slate-400">
             <span><span className="font-medium">Date:</span> {contact.dateContacted}</span>
             {contact.event && <span><span className="font-medium">Event:</span> {contact.event}</span>}
          </div>
        </div>
        <div className="flex-shrink-0 flex space-x-2">
          <button onClick={() => setIsEditing(true)} className="text-sm font-semibold text-slate-500 hover:text-primary-600 dark:hover:text-primary-400">Edit</button>
          <button onClick={() => onDelete(contact.id)} className="text-sm font-semibold text-slate-500 hover:text-red-600 dark:hover:text-red-400">Delete</button>
        </div>
      </div>
      <div className="mt-3 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
          <p className="font-semibold text-xs text-slate-500 uppercase mb-1">Notes</p>
          {contact.notes}
      </div>

      {!generatedTools && !isGenerating && (
          <button 
            onClick={handleGenerateTools}
            className="mt-4 w-full py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-sm font-semibold rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center justify-center"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
              </svg>
              Draft Message & Topics
          </button>
      )}

      {isGenerating && (
          <div className="mt-4 flex justify-center">
              <LoadingSpinner className="w-6 h-6" />
          </div>
      )}

      {generatedTools && (
          <div className="mt-4 space-y-3 animate-fade-in">
              <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded border border-blue-100 dark:border-blue-800">
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-300 uppercase mb-1">Draft Message</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{generatedTools.message}"</p>
              </div>
               <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded border border-green-100 dark:border-green-800">
                  <p className="text-xs font-bold text-green-600 dark:text-green-300 uppercase mb-1">Quick-Fire Topics</p>
                  <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300 space-y-1">
                      {generatedTools.topics.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
              </div>
          </div>
      )}
    </Card>
  );
};


const Pinboard: React.FC<PinboardProps> = ({ pins, onUpdatePins, networkContacts, onUpdateContacts, onBack, user }) => {
  const [activeTab, setActiveTab] = useState<'pins' | 'networking'>('pins');

  // Pins state
  const [showAddPinForm, setShowAddPinForm] = useState(false);
  const [newPinTitle, setNewPinTitle] = useState('');
  const [newPinContent, setNewPinContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Networking state
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [newContact, setNewContact] = useState<Omit<NetworkContact, 'id'>>({ name: '', company: '', role: '', dateContacted: '', notes: '', event: '' });
  const [contactSearchQuery, setContactSearchQuery] = useState('');


  const filteredPins = useMemo(() => {
    if (!searchQuery) return pins;
    return pins.filter(pin => 
        pin.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pin.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pins, searchQuery]);

  const filteredContacts = useMemo(() => {
    if (!contactSearchQuery) return networkContacts;
    const query = contactSearchQuery.toLowerCase();
    return networkContacts.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.company.toLowerCase().includes(query) ||
      c.role.toLowerCase().includes(query) ||
      c.notes.toLowerCase().includes(query)
    );
  }, [networkContacts, contactSearchQuery]);

  const handleAddPin = () => {
      if (!newPinTitle.trim() || !newPinContent.trim()) return;
      const newPin: Pin = {
          id: `pin-${Date.now()}`,
          title: newPinTitle,
          content: newPinContent,
      };
      onUpdatePins([...pins, newPin].sort((a, b) => a.title.localeCompare(b.title)));
      setNewPinTitle('');
      setNewPinContent('');
      setShowAddPinForm(false);
  }

  const handleDeletePin = (id: string) => onUpdatePins(pins.filter(p => p.id !== id));
  const handleUpdatePin = (id: string, title: string, content: string) => {
      onUpdatePins(pins.map(p => p.id === id ? {...p, title, content} : p).sort((a, b) => a.title.localeCompare(b.title)));
  }
  
  const handleAddContact = () => {
    if (!newContact.name.trim() || !newContact.company.trim()) return;
    const contactToAdd: NetworkContact = { id: `contact-${Date.now()}`, ...newContact };
    onUpdateContacts([...networkContacts, contactToAdd].sort((a,b) => a.name.localeCompare(b.name)));
    setNewContact({ name: '', company: '', role: '', dateContacted: new Date().toISOString().split('T')[0], notes: '', event: '' });
    setShowAddContactForm(false);
  }

  const handleUpdateContact = (updatedContact: NetworkContact) => {
    onUpdateContacts(networkContacts.map(c => c.id === updatedContact.id ? updatedContact : c).sort((a, b) => a.name.localeCompare(b.name)));
  }

  const handleDeleteContact = (id: string) => onUpdateContacts(networkContacts.filter(c => c.id !== id));

  const tabClasses = (isActive: boolean) => 
    `px-3 py-2 font-semibold text-sm rounded-t-lg transition-colors ${
      isActive
        ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400'
        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
    }`;


  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} text="Back to Jobs"/>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Your Pinboard</h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">A quick-access board for your application tools.</p>
        </div>
        <button 
            onClick={() => activeTab === 'pins' ? setShowAddPinForm(p => !p) : setShowAddContactForm(c => !c)}
            className="px-5 py-2 bg-primary-600 text-white font-bold rounded-lg shadow-md hover:bg-primary-700 transition-transform hover:scale-105"
        >
            { (activeTab === 'pins' && showAddPinForm) || (activeTab === 'networking' && showAddContactForm) ? 'Cancel' : (activeTab === 'pins' ? 'Add New Pin' : 'Add New Contact') }
        </button>
      </div>

      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button onClick={() => setActiveTab('pins')} className={tabClasses(activeTab === 'pins')}>Application</button>
          <button onClick={() => setActiveTab('networking')} className={tabClasses(activeTab === 'networking')}>Networking</button>
        </nav>
      </div>

      {activeTab === 'pins' && (
        <div className="space-y-6">
          {showAddPinForm && (
              <Card>
                  <div className="space-y-4">
                      <input type="text" placeholder="Title (e.g., 'My biggest weakness')" value={newPinTitle} onChange={(e) => setNewPinTitle(e.target.value)} className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                      <textarea placeholder="Content / Answer..." value={newPinContent} onChange={(e) => setNewPinContent(e.target.value)} className="w-full p-3 h-32 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" rows={4} />
                       <button onClick={handleAddPin} className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-md hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500">Save Pin</button>
                  </div>
              </Card>
          )}
          <Card><input type="text" placeholder="Search pins..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" /></Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPins.map(pin => (<PinCard key={pin.id} pin={pin} onDelete={handleDeletePin} onUpdate={handleUpdatePin} />))}
          </div>
          {pins.length === 0 && !showAddPinForm && (<Card><p className="text-center text-slate-600 dark:text-slate-400 py-8">Your pinboard is empty. Click 'Add New Pin' to start saving your application answers!</p></Card>)}
          {filteredPins.length === 0 && pins.length > 0 && !showAddPinForm && (<Card><p className="text-center text-slate-600 dark:text-slate-400 py-8">No pins found for your search query.</p></Card>)}
        </div>
      )}
      
      {activeTab === 'networking' && (
          <div className="space-y-6">
              {showAddContactForm && (
                  <Card>
                      <div className="space-y-3">
                          <label className="block text-xs font-medium text-slate-500 uppercase">New Contact Details</label>
                          <input value={newContact.name} onChange={e => setNewContact(c => ({...c, name: e.target.value}))} placeholder="Name" className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input value={newContact.company} onChange={e => setNewContact(c => ({...c, company: e.target.value}))} placeholder="Company" className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                            <input value={newContact.role} onChange={e => setNewContact(c => ({...c, role: e.target.value}))} placeholder="Role" className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input value={newContact.event} onChange={e => setNewContact(c => ({...c, event: e.target.value}))} placeholder="Event / Context (e.g. Career Fair)" className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                              <input type="date" value={newContact.dateContacted} onChange={e => setNewContact(c => ({...c, dateContacted: e.target.value}))} className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                          </div>
                          <textarea value={newContact.notes} onChange={e => setNewContact(c => ({...c, notes: e.target.value}))} placeholder="Notes / Main Takeaways..." rows={4} className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                          <button onClick={handleAddContact} className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-md hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500">Save Contact</button>
                      </div>
                  </Card>
              )}
              <Card><input type="text" placeholder="Search contacts..." value={contactSearchQuery} onChange={(e) => setContactSearchQuery(e.target.value)} className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" /></Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredContacts.map(contact => (<NetworkContactCard key={contact.id} contact={contact} user={user} onDelete={handleDeleteContact} onUpdate={handleUpdateContact} />))}
              </div>
              {networkContacts.length === 0 && !showAddContactForm && (<Card><p className="text-center text-slate-600 dark:text-slate-400 py-8">Your networking dashboard is empty. Click 'Add New Contact' to log your professional connections!</p></Card>)}
              {filteredContacts.length === 0 && networkContacts.length > 0 && !showAddContactForm && (<Card><p className="text-center text-slate-600 dark:text-slate-400 py-8">No contacts found for your search query.</p></Card>)}
          </div>
      )}
    </div>
  );
};

export default Pinboard;
