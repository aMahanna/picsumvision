/* eslint-disable */
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { render, screen } from '@testing-library/react';

import History from '../pages/History';
import Search from '../pages/Search';
import NavBar from '../components/NavBar';
import Info from '../pages/Info';
import Landing from '../pages/Landing';

test('render the react navbar component', () => {
  render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <NavBar />
      </I18nextProvider>
    </BrowserRouter>,
  );
  const titleElement = screen.getByText(/Picsum Vision/);
  expect(titleElement).toBeInTheDocument();

  const searchElement = screen.getByText(/Search/);
  expect(searchElement).toBeInTheDocument();

  const historyElement = screen.getByText(/History/);
  expect(historyElement).toBeInTheDocument();

  const aboutElement = screen.getByText(/About/);
  expect(aboutElement).toBeInTheDocument();
});

test('render the react landing page', () => {
  render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <Landing />
      </I18nextProvider>
    </BrowserRouter>,
  );
  const titleElement = screen.getByText(/Lorem Picsum \+ Google Vision/);
  expect(titleElement).toBeInTheDocument();
});

test('render the search page', async () => {
  render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <Search />
      </I18nextProvider>
    </BrowserRouter>,
  );

  const searchTextElement = screen.getByText(/Search by keywords \/ image url/);
  expect(searchTextElement).toBeInTheDocument();

  const visualizeButton: any = screen.getByRole('button', { name: /Visualize/i });
  expect(visualizeButton.className.split(' ')).toContain('Mui-disabled');

  const discoverButton: any = screen.getByRole('button', { name: /Discover/i });
  expect(discoverButton.className.split(' ')).toContain('Mui-disabled');
});

test('render the history page', () => {
  render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <History />
      </I18nextProvider>
    </BrowserRouter>,
  );

  const makeHistoryElement = screen.getByText(/Make History/);
  expect(makeHistoryElement).toBeInTheDocument();
});

test('render the info page', async () => {
  render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <Info match={{ params: { id: '0' } }} />
      </I18nextProvider>
    </BrowserRouter>,
  );
});
