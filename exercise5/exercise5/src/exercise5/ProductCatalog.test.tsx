import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCatalog } from './ProductCatalog';

describe('ProductCatalog', () => {
  it('search with valid query shows matching products', async () => {
    render(<ProductCatalog />);

    await userEvent.type(screen.getByTestId('search-input'), 'headphones');

    expect(
      screen.getByRole('heading', { name: /Wireless Bluetooth Headphones/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('result-count')).toHaveTextContent(/1 product/);
  });

  it('search with no results shows empty state', async () => {
    render(<ProductCatalog />);

    await userEvent.type(screen.getByTestId('search-input'), 'xyznonexistent999');

    expect(screen.getByTestId('product-catalog-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('product-card-1')).not.toBeInTheDocument();
  });

  it('apply single category filter restricts results', async () => {
    render(<ProductCatalog />);

    await userEvent.click(screen.getByTestId('filter-category-Apparel'));

    expect(
      screen.queryByRole('heading', { name: /Wireless Bluetooth Headphones/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Organic Cotton T-Shirt/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('result-count')).toHaveTextContent(/3 products/);
  });

  it('apply multiple filters intersects criteria', async () => {
    render(<ProductCatalog />);

    await userEvent.click(screen.getByTestId('filter-category-Electronics'));
    await userEvent.click(screen.getByTestId('filter-price-under50'));

    expect(
      screen.getByRole('heading', { name: /USB-C Hub 7-in-1/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Wireless Bluetooth Headphones/i }),
    ).not.toBeInTheDocument();
  });

  it('clear all filters restores full catalog view', async () => {
    render(<ProductCatalog />);

    await userEvent.type(screen.getByTestId('search-input'), 'mug');
    await userEvent.click(screen.getByTestId('filter-category-Home'));
    expect(screen.getByTestId('result-count')).not.toHaveTextContent(/18 products/);

    await userEvent.click(screen.getByTestId('clear-filters'));

    expect(screen.getByTestId('search-input')).toHaveValue('');
    expect(screen.getByTestId('result-count')).toHaveTextContent(/18 products/);
    expect(screen.getByTestId('sort-select')).toHaveValue('featured');
  });

  it('pagination navigates between pages', async () => {
    render(<ProductCatalog />);

    expect(
      screen.getByRole('heading', { name: /Wireless Bluetooth Headphones/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Yoga Mat Pro/i }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('pagination-next'));

    expect(
      screen.getByRole('heading', { name: /Yoga Mat Pro/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Wireless Bluetooth Headphones/i }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('pagination-prev'));
    expect(
      screen.getByRole('heading', { name: /Wireless Bluetooth Headphones/i }),
    ).toBeInTheDocument();
  });

  it('sort by price low to high orders results', async () => {
    render(<ProductCatalog />);

    await userEvent.selectOptions(screen.getByTestId('sort-select'), 'price-asc');

    const titles = screen.getAllByRole('heading', { level: 2 });
    expect(titles[0]).toHaveTextContent(/Insulated Water Bottle/i);
    expect(titles[1]).toHaveTextContent(/Ceramic Coffee Mug/i);
  });

  it('sort by name A–Z orders results', async () => {
    render(<ProductCatalog />);

    await userEvent.selectOptions(screen.getByTestId('sort-select'), 'title-asc');

    const titles = screen.getAllByRole('heading', { level: 2 });
    expect(titles[0]).toHaveTextContent(/Athletic Shorts/i);
  });
});
