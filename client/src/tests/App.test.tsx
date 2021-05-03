import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { render, screen } from '@testing-library/react';
import App from '../components/App';

test('renders the react navbar', () => {
  render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </BrowserRouter>,
  );
  const titleElement = screen.getByText(/Picsum Vision/i);
  expect(titleElement).toBeInTheDocument();

  const searchElement = screen.getByText(/Search/i);
  expect(searchElement).toBeInTheDocument();

  const aboutElement = screen.getByText(/About/i);
  expect(aboutElement).toBeInTheDocument();
});
