// src/screens/WorshipScreen.js
// Worship Content — thin wrapper around the shared FaithContentScreen.
// All data, styling, and interaction logic lives in one place (see
// screens/library/FaithContentScreen.js + constants/contentKinds.js) so
// Bible/Jesus/Prayers/Worship never drift out of sync with each other.
import React from 'react';
import FaithContentScreen from './library/FaithContentScreen';

export default function WorshipScreen() {
  return <FaithContentScreen kind="worship" />;
}
