import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ApiService } from '@core/services/api.service';
import { environment } from '@env/environment';
import { Product } from '@models/index';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  imageUrl = environment.apiUrl.replace(/\/api\/?$/, '');

  products: Product[] = [
    { _id: '1', id: '1', name: 'Panel VIP PC', description: 'Panel completo para Free Fire en PC con ESP, Aimbot, Radar y más', category: 'Free Fire PC', prices: [{ duration: '1 Día', price: 1 }, { duration: '7 Días', price: 5 }, { duration: '14 Días', price: 10 }, { duration: '30 Días', price: 20 }, { duration: '90 Días', price: 30 }, { duration: '365 Días', price: 40 }], priceFrom: 1, priceTo: 40, stock: 999, badge: 'HOT', badgeType: 'danger', sales: 0, icon: 'fas fa-desktop', image: '', createdAt: '', updatedAt: '' },
    { _id: '2', id: '2', name: 'Bypass APK', description: 'Bypass para detecci\u00f3n APK en Free Fire', category: 'Free Fire Bypass', prices: [{ duration: '1 Día', price: 1 }, { duration: '7 Días', price: 4 }, { duration: '14 Días', price: 9 }, { duration: '30 Días', price: 12 }], priceFrom: 1, priceTo: 12, stock: 999, badge: 'VIP', badgeType: 'info', sales: 0, icon: 'fas fa-shield-alt', image: '', createdAt: '', updatedAt: '' },
    { _id: '3', id: '3', name: 'Panel Proxy Android', description: 'Panel proxy para cuentas principales Android', category: 'Free Fire Proxy', prices: [{ duration: '1 Día', price: 2 }, { duration: '3 Días', price: 5 }, { duration: '7 Días', price: 11 }, { duration: '30 Días', price: 25 }], priceFrom: 2, priceTo: 25, stock: 999, badge: 'ANDROID', badgeType: 'success', sales: 0, icon: 'fas fa-mobile-alt', image: '', createdAt: '', updatedAt: '' },
    { _id: '4', id: '4', name: 'Panel Proxy iOS', description: 'Panel proxy para cuentas principales iOS', category: 'Free Fire Proxy', prices: [{ duration: '1 Día', price: 2 }, { duration: '3 Días', price: 5 }, { duration: '7 Días', price: 11 }, { duration: '30 Días', price: 25 }], priceFrom: 2, priceTo: 25, stock: 999, badge: 'iOS', badgeType: 'purple', sales: 0, icon: 'fas fa-mobile-alt', image: '', createdAt: '', updatedAt: '' },
    { _id: '5', id: '5', name: 'Diamantes', description: 'Diamantes Free Fire baratos', category: 'Free Fire Diamantes', prices: [], priceFrom: 0, priceTo: 0, stock: 0, badge: 'PRÓXIMAMENTE', badgeType: 'warning', sales: 0, icon: 'fas fa-gem', image: '', createdAt: '', updatedAt: '' },
  ];

  showProductModal = false;
  editingProduct: any = null;
  productForm: any = {
    name: '', description: '', category: 'Free Fire PC',
    prices: [{ duration: '1 Día', price: 0 }],
    stock: 999, badge: '', badgeType: 'info', icon: 'fas fa-box', image: ''
  };
  productImageFile: File | null = null;
  productImagePreview = '';
  isDragging = false;
  productError = '';
  productSuccess = '';
  productSaving = false;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  get isGuest(): boolean { return !this.auth.isLoggedIn; }
  get isAdmin(): boolean {
    const user = this.auth.user;
    return user?.role === 'admin' || user?.role === 'superadmin';
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.api.get<any>('products').subscribe({
      next: (res) => {
        if (res.data && res.data.length > 0) {
          this.products = res.data.map((p: any) => ({
            ...p,
            id: p._id,
            priceFrom: p.prices?.length > 0 ? Math.min(...p.prices.map((pr: any) => pr.price)) : 0,
            priceTo: p.prices?.length > 0 ? Math.max(...p.prices.map((pr: any) => pr.price)) : 0,
          }));
        }
      },
      error: () => {}
    });
  }

  openProductModal(product?: any): void {
    this.productError = '';
    this.productSuccess = '';
    this.productImageFile = null;
    this.productImagePreview = '';
    if (product) {
      this.editingProduct = product;
      this.productForm = {
        name: product.name, description: product.description, category: product.category,
        prices: [...(product.prices || []).map((p: any) => ({ ...p }))],
        stock: product.stock ?? 999, badge: product.badge || '', badgeType: product.badgeType || 'info',
        icon: product.icon || 'fas fa-box', image: product.image || ''
      };
      this.productImagePreview = product.image ? (product.image.startsWith('/') ? this.imageUrl + product.image : product.image) : '';
    } else {
      this.editingProduct = null;
      this.productForm = {
        name: '', description: '', category: 'Free Fire PC',
        prices: [{ duration: '1 Día', price: 0 }],
        stock: 999, badge: '', badgeType: 'info', icon: 'fas fa-box', image: ''
      };
    }
    this.showProductModal = true;
  }

  closeProductModal(): void {
    this.showProductModal = false;
    this.editingProduct = null;
    this.productImageFile = null;
    this.productImagePreview = '';
    this.productError = '';
    this.productSuccess = '';
  }

  onProductImageSelect(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    this.processImageFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processImageFile(files[0]);
    }
  }

  private processImageFile(file: File): void {
    if (!file.type.startsWith('image/')) { this.productError = 'Solo se permiten archivos de imagen'; return; }
    if (file.size > 2 * 1024 * 1024) { this.productError = 'La imagen no puede superar 2MB'; return; }
    this.productImageFile = file;
    this.productError = '';
    const reader = new FileReader();
    reader.onload = () => { this.productImagePreview = reader.result as string; };
    reader.readAsDataURL(file);
  }

  removeProductImage(): void {
    this.productImageFile = null;
    this.productImagePreview = '';
    this.productForm.image = '';
  }

  addPriceRow(): void {
    this.productForm.prices.push({ duration: '', price: 0 });
  }

  removePriceRow(index: number): void {
    this.productForm.prices.splice(index, 1);
  }

  saveProduct(): void {
    this.productError = '';
    const { name, description, category } = this.productForm;
    if (!name || !description || !category) { this.productError = 'Nombre, descripción y categoría son requeridos'; return; }

    this.productSaving = true;
    const fd = new FormData();
    fd.append('name', name);
    fd.append('description', description);
    fd.append('category', category);
    fd.append('prices', JSON.stringify(this.productForm.prices));
    fd.append('stock', String(this.productForm.stock));
    fd.append('badge', this.productForm.badge);
    fd.append('badgeType', this.productForm.badgeType);
    fd.append('icon', this.productForm.icon);
    if (this.productImageFile) {
      fd.append('imageFile', this.productImageFile);
    } else if (!this.editingProduct && this.productForm.image) {
      fd.append('image', this.productForm.image);
    }

    const req = this.editingProduct
      ? this.api.put<any>(`products/${this.editingProduct._id || this.editingProduct.id}`, fd)
      : this.api.post<any>('products', fd);

    req.subscribe({
      next: () => {
        this.productSuccess = this.editingProduct ? 'Producto actualizado' : 'Producto creado';
        this.loadProducts();
        setTimeout(() => this.closeProductModal(), 1200);
        this.productSaving = false;
      },
      error: (err) => { this.productError = err.error?.message || 'Error al guardar producto'; this.productSaving = false; }
    });
  }

  deleteProduct(product: any): void {
    if (!confirm(`¿Eliminar "${product.name}"?`)) return;
    this.api.delete<any>(`products/${product._id || product.id}`).subscribe({
      next: () => this.loadProducts(),
      error: () => {}
    });
  }

  buyProduct(product: any): void {
    if (this.isGuest) { this.router.navigate(['/auth/login']); return; }
  }
}
