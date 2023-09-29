import {
  BooleanModel,
  NumberModel,
  ObjectModel,
  StringModel,
  _getPropertyModel,
  makeObjectEmptyValueCreator,
} from '@hilla/form';
import type { CrudService } from '../src/crud';
import type Filter from '../src/types/dev/hilla/crud/filter/Filter';
import type PropertyStringFilter from '../src/types/dev/hilla/crud/filter/PropertyStringFilter';
import type Pageable from '../src/types/dev/hilla/mappedtypes/Pageable';
import Direction from '../src/types/org/springframework/data/domain/Sort/Direction';

export interface Company {
  id: number;
  version: number;
  name: string;
  foundedDate: string;
}

export interface Person {
  id: number;
  version: number;
  firstName: string;
  lastName: string;
  email: string;
  someNumber: number;
  vip: boolean;
}

export interface ColumnRendererTestValues {
  id: number;
  string: string;
  number: number;
  boolean: boolean;
  date?: string;
  localDate?: string;
  localTime?: string;
  localDateTime?: string;
}

export class PersonModel<T extends Person = Person> extends ObjectModel<T> {
  static override createEmptyValue = makeObjectEmptyValueCreator(PersonModel);

  get id(): NumberModel {
    return this[_getPropertyModel](
      'id',
      (parent, key) =>
        new NumberModel(parent, key, false, { meta: { annotations: [{ name: 'jakarta.persistence.Id' }] } }),
    );
  }

  get version(): NumberModel {
    return this[_getPropertyModel](
      'version',
      (parent, key) =>
        new NumberModel(parent, key, false, { meta: { annotations: [{ name: 'jakarta.persistence.Version' }] } }),
    );
  }

  get firstName(): StringModel {
    return this[_getPropertyModel]('firstName', (parent, key) => new StringModel(parent, key, false));
  }

  get lastName(): StringModel {
    return this[_getPropertyModel]('lastName', (parent, key) => new StringModel(parent, key, false));
  }

  get email(): StringModel {
    return this[_getPropertyModel]('email', (parent, key) => new StringModel(parent, key, false));
  }

  get someNumber(): NumberModel {
    return this[_getPropertyModel]('someNumber', (parent, key) => new NumberModel(parent, key, false));
  }

  get vip(): BooleanModel {
    return this[_getPropertyModel]('vip', (parent, key) => new BooleanModel(parent, key, false));
  }
}

export class CompanyModel<T extends Company = Company> extends ObjectModel<T> {
  declare static createEmptyValue: () => Company;

  get id(): NumberModel {
    return this[_getPropertyModel](
      'id',
      (parent, key) =>
        new NumberModel(parent, key, false, { meta: { annotations: [{ name: 'jakarta.persistence.Id' }] } }),
    );
  }

  get version(): NumberModel {
    return this[_getPropertyModel](
      'version',
      (parent, key) =>
        new NumberModel(parent, key, false, { meta: { annotations: [{ name: 'jakarta.persistence.Version' }] } }),
    );
  }

  get name(): StringModel {
    return this[_getPropertyModel]('name', (parent, key) => new StringModel(parent, key, false));
  }

  get foundedDate(): StringModel {
    return this[_getPropertyModel]('foundedDate', (parent, key) => new StringModel(parent, key, false));
  }
}

export class ColumnRendererTestModel<
  T extends ColumnRendererTestValues = ColumnRendererTestValues,
> extends ObjectModel<T> {
  declare static createEmptyValue: () => Company;

  get id(): NumberModel {
    return this[_getPropertyModel](
      'id',
      (parent, key) =>
        new NumberModel(parent, key, false, { meta: { annotations: [{ name: 'jakarta.persistence.Id' }] } }),
    );
  }

  get string(): StringModel {
    return this[_getPropertyModel]('string', (parent, key) => new StringModel(parent, key, false));
  }

  get number(): NumberModel {
    return this[_getPropertyModel]('number', (parent, key) => new NumberModel(parent, key, false));
  }

  get boolean(): BooleanModel {
    return this[_getPropertyModel]('boolean', (parent, key) => new BooleanModel(parent, key, false));
  }

  get date(): StringModel {
    return this[_getPropertyModel](
      'date',
      (parent, key) => new StringModel(parent, key, false, { meta: { javaType: 'java.util.Date' } }),
    );
  }

  get localDate(): StringModel {
    return this[_getPropertyModel](
      'localDate',
      (parent, key) => new StringModel(parent, key, false, { meta: { javaType: 'java.time.LocalDate' } }),
    );
  }

  get localTime(): StringModel {
    return this[_getPropertyModel](
      'localTime',
      (parent, key) => new StringModel(parent, key, false, { meta: { javaType: 'java.time.LocalTime' } }),
    );
  }

  get localDateTime(): StringModel {
    return this[_getPropertyModel](
      'localDateTime',
      (parent, key) => new StringModel(parent, key, false, { meta: { javaType: 'java.time.LocalDateTime' } }),
    );
  }
}

type HasId = {
  id: number;
};

export const createService = <T extends HasId>(initialData: T[]): CrudService<T> & HasLastFilter => {
  let _lastFilter: Filter | undefined;
  let data = initialData;

  return {
    async list(request: Pageable, filter: Filter | undefined): Promise<T[]> {
      _lastFilter = filter;
      let filteredData: T[] = [];
      if (request.pageNumber === 0) {
        /* eslint-disable */
        if (filter && (filter as any).t === 'propertyString') {
          const propertyFilter: PropertyStringFilter = filter as PropertyStringFilter;
          filteredData = data.filter((item) => {
            const propertyValue = (item as any)[propertyFilter.propertyId];
            if (propertyFilter.matcher === 'CONTAINS') {
              return propertyValue.includes(propertyFilter.filterValue);
            }
            return propertyValue === propertyFilter.filterValue;
          });
        } else {
          filteredData = data;
        }
        /* eslint-enable */
      }

      if (request.sort.orders.length === 1) {
        const sortPropertyId = request.sort.orders[0]!.property;
        const directionMod = request.sort.orders[0]!.direction === Direction.ASC ? 1 : -1;
        filteredData.sort((a, b) =>
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (a as any)[sortPropertyId] > (b as any)[sortPropertyId] ? Number(directionMod) : -1 * directionMod,
        );
      }
      return filteredData;
    },
    async save(value: T): Promise<T | undefined> {
      data = data.map((item) => (item.id === value.id ? value : item));
      return data.find((item) => item.id === value.id);
    },
    get lastFilter() {
      return _lastFilter;
    },
  };
};

export const personData: Person[] = [
  { id: 1, version: 1, firstName: 'John', lastName: 'Dove', email: 'john@example.com', someNumber: -12, vip: true },
  { id: 2, version: 1, firstName: 'Jane', lastName: 'Love', email: 'jane@example.com', someNumber: 123456, vip: false },
];

export const companyData: Company[] = [
  { id: 1, version: 1, name: 'Vaadin Ltd', foundedDate: '2000-05-06' },
  { id: 2, version: 1, name: 'Google', foundedDate: '1998-09-04' },
];

export const columnRendererTestData: ColumnRendererTestValues[] = [
  {
    id: 1,
    string: 'Hello World 1',
    number: 123456,
    boolean: true,
    date: '2021-05-13T00:00:00',
    localDate: '2021-05-13',
    localTime: '08:45:00',
    localDateTime: '2021-05-13T08:45:00',
  },
  {
    id: 2,
    string: 'Hello World 2',
    number: -12,
    boolean: false,
    date: '2021-05-14T00:00:00',
    localDate: '2021-05-14',
    localTime: '20:45:00',
    localDateTime: '2021-05-14T20:45:00',
  },
  {
    id: 3,
    string: 'Hello World 3',
    number: -12,
    boolean: false,
  },
  {
    id: 4,
    string: 'Hello World 4',
    number: -12,
    boolean: false,
    date: 'foo',
    localDate: 'foo',
    localTime: 'foo',
    localDateTime: 'foo',
  },
];

export type HasLastFilter = {
  lastFilter: Filter | undefined;
};

export const personService = (): CrudService<Person> & HasLastFilter => createService(personData);
export const companyService = (): CrudService<Company> & HasLastFilter => createService(companyData);
export const columnRendererTestService = (): CrudService<ColumnRendererTestValues> & HasLastFilter =>
  createService(columnRendererTestData);