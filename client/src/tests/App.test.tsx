import React from 'react';
import { BrowserRouter, Redirect } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { render, screen, fireEvent, queryByAttribute } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import App from '../pages/App';
import History from '../pages/History';
import Search from '../pages/Search';
import NavBar from '../components/NavBar';

const whenStable = async () =>
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });

const getById = queryByAttribute.bind(null, 'id');
test('render the react navbar', () => {
  render(
    <BrowserRouter>
      <NavBar />
    </BrowserRouter>,
  );
  const titleElement = screen.getByText(/general.title/i);
  expect(titleElement).toBeInTheDocument();

  const historyElement = screen.getByText(/general.historyButton/i);
  expect(historyElement).toBeInTheDocument();

  const aboutElement = screen.getByText(/general.aboutButton/i);
  expect(aboutElement).toBeInTheDocument();
});

test('renders the search tab', async () => {
  const dom = render(
    <BrowserRouter>
      <Search />
    </BrowserRouter>,
  );

  const searchTextElement = screen.getByText(/searchPage.inputLabel/i);
  expect(searchTextElement).toBeInTheDocument();

  const queryButton = getById(dom.container, 'search-submit');
  expect(queryButton).toBeInTheDocument();
  fireEvent.click(queryButton!);
});

test('renders the history tab', () => {
  render(
    <BrowserRouter>
      <History />
    </BrowserRouter>,
  );

  const makeHistoryElement = screen.getByText(/historyPage.makehistory/i);
  expect(makeHistoryElement).toBeInTheDocument();
});
