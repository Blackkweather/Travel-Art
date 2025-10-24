# Travel Art - UI Component Mapping

This document maps the custom UI elements to reactbits.dev components and their props.

## Component Library Mapping

### Navigation Components

#### Navbar
- **reactbits Component**: `Navigation` + `Button`
- **Props**:
  ```tsx
  <Navigation 
    brand="Travel Art"
    logo={<CompassIcon />}
    items={[
      { label: "How it Works", href: "/how-it-works" },
      { label: "Partners", href: "/partners" },
      { label: "Pricing", href: "/pricing" }
    ]}
    actions={[
      <Button variant="secondary" href="/login">Sign In</Button>,
      <Button variant="primary" href="/register">Get Started</Button>
    ]}
  />
  ```

#### Sidebar
- **reactbits Component**: `Sidebar` + `NavItem`
- **Props**:
  ```tsx
  <Sidebar>
    {navItems.map(item => (
      <NavItem
        key={item.path}
        href={item.path}
        icon={item.icon}
        active={isActive}
      >
        {item.label}
      </NavItem>
    ))}
  </Sidebar>
  ```

### Card Components

#### ArtistCard
- **reactbits Component**: `Card` + `Badge` + `Avatar`
- **Props**:
  ```tsx
  <Card className="artist-card">
    <Avatar src={artist.images[0]} alt={artist.name} />
    <CardHeader>
      <CardTitle>{artist.name}</CardTitle>
      <Badge variant="secondary">{artist.discipline}</Badge>
    </CardHeader>
    <CardContent>
      <p>{artist.bio}</p>
      {artist.ratingBadge && (
        <Badge variant="gold">{artist.ratingBadge}</Badge>
      )}
    </CardContent>
  </Card>
  ```

#### HotelCard
- **reactbits Component**: `Card` + `Image` + `Badge`
- **Props**:
  ```tsx
  <Card className="hotel-card">
    <Image src={hotel.images[0]} alt={hotel.name} />
    <CardHeader>
      <CardTitle>{hotel.name}</CardTitle>
      <Badge variant="outline">{hotel.location.city}</Badge>
    </CardHeader>
    <CardContent>
      <p>{hotel.description}</p>
    </CardContent>
  </Card>
  ```

#### BookingCard
- **reactbits Component**: `Card` + `StatusBadge` + `Button`
- **Props**:
  ```tsx
  <Card className="booking-card">
    <CardHeader>
      <CardTitle>Booking #{booking.id}</CardTitle>
      <StatusBadge status={booking.status} />
    </CardHeader>
    <CardContent>
      <p>Artist: {booking.artist.name}</p>
      <p>Hotel: {booking.hotel.name}</p>
      <p>Dates: {formatDateRange(booking.startDate, booking.endDate)}</p>
    </CardContent>
    <CardFooter>
      <Button variant="outline">View Details</Button>
    </CardFooter>
  </Card>
  ```

### Form Components

#### LoginForm
- **reactbits Component**: `Form` + `Input` + `Button`
- **Props**:
  ```tsx
  <Form onSubmit={handleSubmit}>
    <FormField>
      <Label>Email</Label>
      <Input 
        type="email" 
        placeholder="Enter your email"
        {...register('email')}
      />
    </FormField>
    <FormField>
      <Label>Password</Label>
      <Input 
        type="password" 
        placeholder="Enter your password"
        {...register('password')}
      />
    </FormField>
    <Button type="submit" variant="primary" fullWidth>
      Sign In
    </Button>
  </Form>
  ```

#### ArtistProfileForm
- **reactbits Component**: `Form` + `Textarea` + `FileUpload`
- **Props**:
  ```tsx
  <Form onSubmit={handleSubmit}>
    <FormField>
      <Label>Bio</Label>
      <Textarea 
        placeholder="Tell us about yourself..."
        {...register('bio')}
      />
    </FormField>
    <FormField>
      <Label>Discipline</Label>
      <Select {...register('discipline')}>
        <Option value="musician">Musician</Option>
        <Option value="dancer">Dancer</Option>
        <Option value="painter">Painter</Option>
      </Select>
    </FormField>
    <FormField>
      <Label>Images</Label>
      <FileUpload 
        accept="image/*"
        multiple
        onUpload={handleImageUpload}
      />
    </FormField>
  </Form>
  ```

### Modal Components

#### BookingModal
- **reactbits Component**: `Modal` + `DatePicker` + `Textarea`
- **Props**:
  ```tsx
  <Modal 
    open={isOpen} 
    onClose={onClose}
    title="Request Booking"
  >
    <Form onSubmit={handleSubmit}>
      <FormField>
        <Label>Select Dates</Label>
        <DatePicker 
          mode="range"
          value={dateRange}
          onChange={setDateRange}
        />
      </FormField>
      <FormField>
        <Label>Special Requests</Label>
        <Textarea 
          placeholder="Any special requirements..."
          {...register('specialRequests')}
        />
      </FormField>
      <div className="flex gap-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Request Booking
        </Button>
      </div>
    </Form>
  </Modal>
  ```

#### RatingModal
- **reactbits Component**: `Modal` + `Rating` + `Textarea`
- **Props**:
  ```tsx
  <Modal 
    open={isOpen} 
    onClose={onClose}
    title="Rate Artist"
  >
    <Form onSubmit={handleSubmit}>
      <FormField>
        <Label>Rating</Label>
        <Rating 
          value={rating}
          onChange={setRating}
          max={5}
        />
      </FormField>
      <FormField>
        <Label>Review</Label>
        <Textarea 
          placeholder="Share your experience..."
          {...register('textReview')}
        />
      </FormField>
      <Button type="submit" variant="primary">
        Submit Rating
      </Button>
    </Form>
  </Modal>
  ```

### Calendar Components

#### AvailabilityCalendar
- **reactbits Component**: `Calendar` + `DatePicker`
- **Props**:
  ```tsx
  <Calendar
    mode="range"
    value={availabilityRange}
    onChange={setAvailabilityRange}
    disabled={(date) => date < new Date()}
    className="availability-calendar"
  />
  ```

#### BookingCalendar
- **reactbits Component**: `Calendar` + `Badge`
- **Props**:
  ```tsx
  <Calendar
    mode="single"
    value={selectedDate}
    onChange={setSelectedDate}
    className="booking-calendar"
    modifiers={{
      booked: bookedDates,
      available: availableDates
    }}
    modifiersClassNames={{
      booked: 'bg-red-100',
      available: 'bg-green-100'
    }}
  />
  ```

### Data Display Components

#### AdminTable
- **reactbits Component**: `Table` + `Button`
- **Props**:
  ```tsx
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Email</TableHead>
        <TableHead>Role</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {users.map(user => (
        <TableRow key={user.id}>
          <TableCell>{user.name}</TableCell>
          <TableCell>{user.email}</TableCell>
          <TableCell>
            <Badge variant="outline">{user.role}</Badge>
          </TableCell>
          <TableCell>
            <StatusBadge status={user.isActive ? 'active' : 'inactive'} />
          </TableCell>
          <TableCell>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
  ```

#### StatsCard
- **reactbits Component**: `Card` + `Stat`
- **Props**:
  ```tsx
  <Card className="stats-card">
    <CardHeader>
      <CardTitle>Platform Statistics</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        <Stat 
          label="Total Artists" 
          value={stats.totalArtists}
          icon={<Users />}
        />
        <Stat 
          label="Total Hotels" 
          value={stats.totalHotels}
          icon={<Building />}
        />
        <Stat 
          label="Active Bookings" 
          value={stats.activeBookings}
          icon={<Calendar />}
        />
        <Stat 
          label="Total Revenue" 
          value={`€${stats.totalRevenue}`}
          icon={<DollarSign />}
        />
      </div>
    </CardContent>
  </Card>
  ```

### Loading Components

#### LoadingSpinner
- **reactbits Component**: `Spinner` + custom compass animation
- **Props**:
  ```tsx
  <div className="loading-container">
    <Spinner size="lg" className="compass-loader" />
    <p>Loading...</p>
  </div>
  ```

#### SkeletonCard
- **reactbits Component**: `Skeleton`
- **Props**:
  ```tsx
  <Card>
    <Skeleton className="h-48 w-full" />
    <CardHeader>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </CardContent>
  </Card>
  ```

### Notification Components

#### Toast
- **reactbits Component**: `Toast` + `ToastProvider`
- **Props**:
  ```tsx
  <ToastProvider>
    <Toast 
      title="Success!"
      description="Your booking has been confirmed."
      variant="success"
    />
  </ToastProvider>
  ```

#### Alert
- **reactbits Component**: `Alert`
- **Props**:
  ```tsx
  <Alert variant="warning">
    <AlertTitle>Membership Expiring</AlertTitle>
    <AlertDescription>
      Your membership expires in 7 days. Renew now to continue booking.
    </AlertDescription>
  </Alert>
  ```

## Custom Styling Classes

### Theme Colors
- `.bg-navy` - Primary navy background (#0B1F3F)
- `.bg-gold` - Gold accent background (#C9A63C)
- `.bg-cream` - Cream background (#F9F8F3)
- `.text-navy` - Navy text color
- `.text-gold` - Gold text color

### Interactive Elements
- `.gold-underline` - Gold underline effect on hover
- `.btn-primary` - Primary navy button
- `.btn-secondary` - Secondary outlined button
- `.btn-gold` - Gold accent button

### Layout
- `.card-luxury` - Luxury card with gold accent border
- `.container` - Centered container with max-width
- `.compass-loader` - Custom compass loading animation

## Animation Hooks

### Framer Motion Integration
```tsx
import { motion } from 'framer-motion'

// Fade in animation
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.6 }}
>
  Content
</motion.div>

// Slide up animation
<motion.div
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
  Content
</motion.div>
```

### ReactBits Transitions
```tsx
import { useTransition } from 'reactbits'

const { isVisible, toggle } = useTransition()

// Use with components
<Modal open={isVisible} onClose={toggle}>
  Content
</Modal>
```

## Responsive Breakpoints

- Mobile: ≤640px
- Tablet: 641-1024px  
- Desktop: ≥1025px

Use Tailwind responsive prefixes:
- `sm:` - ≥640px
- `md:` - ≥768px
- `lg:` - ≥1024px
- `xl:` - ≥1280px


