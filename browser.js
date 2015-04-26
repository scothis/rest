/*
 * Copyright 2014-2015 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

import rest from './client/default';
import browser from './client/xhr';

rest.setPlatformDefaultClient(browser);

export default rest;
